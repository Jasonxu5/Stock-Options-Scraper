const Discord = require('discord.js');
const client = new Discord.Client();

const prefix = '-';
let num_rows;

//Setup website scraping function
const puppeteer = require('puppeteer');

async function scrapeFlow(url, numberOfRows, numberOfSmartMoneyRows) {
  //setup website
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.type('#login > input[type=text]:nth-child(3)', ''); // user credentials input
  await page.type('#login > input.am-pass-reveal', ''); // user credentials input
  await page.click('#login > input.button.is-primary.btn.btn-primary');


  console.log('New Page URL:', page.url());
  await page.waitForNavigation();


  let scrapeData = await page.evaluate((numberOfRows, numberOfSmartMoneyRows) => {
    let tickers = [];
    let expiries = [];
    let strikes = [];
    let contract_types = [];
    let reference_prices = [];
    let details = [];
    let types = [];
    let premiums = [];

    let smart_money_dates = [];
    let smart_money_tickers = [];
    let smart_money_sent_values = [];

    for (let i = 1; i <= numberOfRows; i++) {
      ticker_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.ticker`).innerText;
      tickers.push(ticker_elements);

      expiry_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.expiry`).innerText;
      expiries.push(expiry_elements);

      strike_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.strike`).innerText;
      strikes.push(strike_elements);

      contract_types_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.contract-type`).innerText;
      contract_types.push(contract_types_elements);

      reference_prices_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.ref`).innerText;
      reference_prices.push(reference_prices_elements);

      detail_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.details`).innerText;
      details.push(detail_elements);

      type_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.type`).innerText;
      types.push(type_elements);

      premium_elements = document.querySelector(`#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(${i}) > div.premium`).innerText;
      premiums.push(premium_elements);
    }

    for (let i = 1; i <= numberOfSmartMoneyRows; i++) {
      smart_dates = document.querySelector(`#fa_aai > div.alpha-ai-signals.animated.fadeIn > div:nth-child(${i}) > div.date > span`).innerText;
      smart_money_dates.push(smart_dates);

      smart_tickers = document.querySelector(`#fa_aai > div.alpha-ai-signals.animated.fadeIn > div:nth-child(${i}) > div.symbol > span`).innerText;
      smart_money_tickers.push(smart_tickers);

      smart_money_sent = document.querySelector(`#fa_aai > div.alpha-ai-signals.animated.fadeIn > div:nth-child(${i}) > div.sentiment > span`).innerText;
      smart_money_sent_values.push(smart_money_sent);
    }

    return {
      tickers,
      expiries,
      strikes,
      contract_types,
      reference_prices,
      details,
      types,
      premiums,
      smart_money_dates,
      smart_money_tickers,
      smart_money_sent_values
    }
  }, numberOfRows, numberOfSmartMoneyRows);

  await browser.close();
  return scrapeData;
}


client.once('ready', () => {
  console.log('FlowBot is online!');

});

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    return;
  }

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();
  num_rows = args[0];

  if (command === 'ping') {
    message.channel.send('pong!');
  }
  else if (command === 'amazon') {
    try {
      let zzz = await scrapeProduct('');
      console.log(zzz);
      message.channel.send(JSON.stringify(zzz));
    } catch (error) {
      message.channel.send('Error!');
    }
  } else if (command === 'flow') {
    try {
      let num_rows = args[0];
      if (!args[0]) {
        message.reply('Please enter the number of rows to output');
        return;
      } else if (args[1]) {
        message.reply('Too many arguments. Please only enter one number');
        return;
      } else if (args[0] == "0") {
        message.reply('Zero is not an accepted argument. Please only enter a value greater than 0 for the number of rows');
        return;
      } else if (num_rows > 25) {
        message.reply('You requested too many rows to output. Please do not exceed 25 rows');
        return;
      }

      let flow_data = await scrapeFlow('https://app.flowalgo.com/users/login', parseInt(num_rows), 0);
      for (let i = 0; i < parseInt(num_rows); i++) {
        if (flow_data.contract_types[i] == "C") {
          let callEmbed = new Discord.MessageEmbed()
            .setColor('#1db19b') // green
            .addFields(
              { name: 'Ticker', value: flow_data.tickers[i], inline: true },
              { name: 'Expiry', value: flow_data.expiries[i], inline: true },
              { name: 'Strike', value: flow_data.strikes[i], inline: true },
              { name: 'Contract Type', value: flow_data.contract_types[i], inline: true },
              { name: 'Reference Price', value: flow_data.reference_prices[i], inline: true },
              { name: 'Details', value: flow_data.details[i], inline: true },
              { name: 'Premium', value: flow_data.premiums[i], inline: true }
            )
          message.channel.send(callEmbed);
        } else if (flow_data.contract_types[i] === "P") {
          let putEmbed = new Discord.MessageEmbed()
            .setColor('#ff4a68') // red
            .addFields(
              { name: 'Ticker', value: flow_data.tickers[i], inline: true },
              { name: 'Expiry', value: flow_data.expiries[i], inline: true },
              { name: 'Strike', value: flow_data.strikes[i], inline: true },
              { name: 'Contract Type', value: flow_data.contract_types[i], inline: true },
              { name: 'Reference Price', value: flow_data.reference_prices[i], inline: true },
              { name: 'Details', value: flow_data.details[i], inline: true },
              { name: 'Premium', value: flow_data.premiums[i], inline: true }
            )
          message.channel.send(putEmbed);
        }

        //message.channel.send(JSON.stringify("Ticker: " + flow_data.tickers[i] + " | " + "Expiry: " + flow_data.expiries[i] + " | " + "Strike: " + flow_data.strikes[i] + " | " + "Contract_Type: " + flow_data.contract_types[i] + " | " + "Reference_Price: " + flow_data.reference_prices[i] + " | " + "Details: " + flow_data.details[i] + " | " + "Types: " + flow_data.types[i] + " | " + "Premiums: " + flow_data.premiums[i]));
      }
    } catch (error) {
      message.channel.send('Error or 20 rows were not found');
    }
  } else if (command === 'smartmoney') {
    try {
      let num_smart_rows = args[0];
      if (!args[0]) {
        message.reply('Please enter the number of rows to output');
        return;
      } else if (args[1]) {
        message.reply('Too many arguments. Please only enter one number');
        return;
      } else if (num_rows > 5) {
        message.reply('You requested too many rows to output. Please do not exceed 5 rows');
        return;
      }
      let smart_flow = await scrapeFlow('https://app.flowalgo.com/users/login', 0, parseInt(num_smart_rows));
      for (let i = 0; i < parseInt(num_smart_rows); i++) {
        message.channel.send(JSON.stringify("Date: " + smart_flow.smart_money_dates[i] + " | " + "Ticker: " + smart_flow.smart_money_tickers[i] + " | " + "Signal: " + smart_flow.smart_money_sent_values[i]));
      }
    } catch {
      message.channel.send('Error!');
    }
  }

});

client.login(''); // replace with your own Discord Bot Token