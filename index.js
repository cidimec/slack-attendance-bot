const { App, LogLevel } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});

var x=0;
var y=0;
var inicio;
var final;
var porcentaje;
app.message("Inicio de turno", async ({ payload, message, say, context }) => {
  inicio = new Date()
  await say(`Ok <@${message.user}>, se dio inicio a tu turno`);
});

app.message("Fin de turno", async ({ payload, message, say, context }) => {
  final = new Date()
  await say(`Ok <@${message.user}>, se finalizara tu turno, porfavor especifica el porcentaje de tiempo activo en formato decimal e.g. 0.5`);
  app.message(".", async ({ payload, message, say, context }) => {
    await say("Gracias")
    porcentaje = parseFloat(message.text);
  });
});

(async () => {

  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
