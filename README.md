# node-webmentions-notifications
A TypeScript node.js app that when running checks webmention.io endpoints and if new webmentions come in, a local notification is sent.

## How to use
Make sure you have `node` and `npm` installed.

First enter the directory
`cd node-webmentions-notifications`

 Then install the dependencies.
 `npm install`

 copy config.json.example to a real json file.
 `cp config.json.example config.json`

 edit `config.json` and add your webmention.io token and your domain.

 start the program (this will compile the TypeScript into javascript and run the program)
 `npm start`

 By default, the script runs immediately and then it repeats on every hour and half-hour. If you want to change the repeat timing, you can modify the `cronRepeat` in the `config.json` file.

 On the initial running of the script, it will fetch webmentions from the last 2 hours. After that, it will only fetch things that are new in the last 30 minutes.