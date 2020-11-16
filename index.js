/* 
Existen comentarios dentro del codigo que corresponden a funciones "console.log()" las cuales se usaron como flags para saber si se estaban creando correctamente las variables
a ser utilizadas por operaciones o funciones mayores, estos pueden ser eliminados sin problema, pero estan ahi para realizar un chequeo rapido de puntos de quiebre importantes
en caso de haber algun error al correr o al modificar el codigo.
*/
const { App, LogLevel } = require("@slack/bolt");
const store = require('./store')
const messages = require('./messages')
const helpers = require('./helpers')
var mongodb = require("mongodb").MongoClient;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});



var uri ="mongodb+srv://" + process.env.USER + ":" + process.env.PASS + "@cluster0.s37q7.gcp.mongodb.net/" + process.env.DB + "?retryWrites=true&w=majority";

var x=0;
var y=0;
var inicio;
var final;
var porcentaje;
var canal_inicio;
var usuario_inicio;
var usuario_final;
var canal_fin;
var usuario_fin;
var hora_inicio;
var hora_final;
var ctd;

app.command('/inicio_de_turno', async ({ ack, payload, context, say, message }) => {
  canal_inicio = payload.channel_id;
  inicio = new Date();
  var year = inicio.getFullYear();
  var month = inicio.getMonth(); 
  var day = inicio.getDate();
  var fecha = year + "/" + (month+1) + "/" + day;
  if (inicio.getHours()>=4)
  { 
    if(inicio.getMinutes()<10)
    {
      hora_inicio = (inicio.getHours()-4) + ":0" + inicio.getMinutes();
    } else
    {
      hora_inicio = (inicio.getHours()-4) + ":" + inicio.getMinutes();
    }
  }
  else
  {
    if(inicio.getMinutes()<10)
    {
      hora_inicio = (24+(inicio.getHours()-4)) + ":0" + inicio.getMinutes();
    } else
    {
      hora_inicio = (24+(inicio.getHours()-4)) + ":" + inicio.getMinutes();
    }    
  }
  //console.log("Fecha: "+ fecha + " Hora: " + hora)
  //console.log(payload);
  //console.log(message)
  const client_info = await app.client.users.info({
      token: context.botToken,
      user: payload.user_id
  });
  //console.log(client_info.user.real_name);
  usuario_inicio = client_info.user.real_name;
  mongodb.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function(err, client) 
  {
    var db = client.db("CIDIMEC");
    var Database = db.collection("Time_In/Out");
    Database.find({ Usuario: usuario_inicio, Hora_final: "" }).toArray(function(err,lista) {
      if (err) throw err;
      ctd = lista.length;
      //console.log(lista.length);
      if (ctd<1)
      {
        try {
          Database.insertOne({Usuario: usuario_inicio, Fecha_inicio: fecha, Fecha_final: "", Hora_inicio: hora_inicio, Hora_final: "", Tiempo_total: "", Porcentaje_efectivo: "", Tiempo_efectivo: ""});
        } catch (e) {
          console.log(e);
        }
        try {
          const result = app.client.chat.postMessage({
            token: context.botToken,
            channel: canal_inicio,
            text: `Gracias <@${payload.user_id}>, se dio inicio a tu turno`
          });
        } catch (error) {
          console.error(error);
        }
      } else
      {
        try {
          const result = app.client.chat.postMessage({
            token: context.botToken,
            channel: canal_inicio,
            text: `Lo siento <@${payload.user_id}>, existe una sesión aun activa bajo su usuario, porfavor cierrela con el comando '/fin_de_turno' y contacte a su supervisor para revisar si el tiempo trabajado es correcto`
          });
        } catch (error) {
          console.error(error);
        }
      }
  });
  }
  )
  ack();
});

app.command('/fin_de_turno', async ({ ack, payload, context, say, message }) => {
  ack();
  canal_fin = payload.channel_id
  usuario_fin = payload.user_id
  const client_info = await app.client.users.info({
      token: context.botToken,
      user: payload.user_id
  });
  //console.log(client_info.user.real_name);
  usuario_final = client_info.user.real_name
  console.log(usuario_final)
  try {
    const result = await app.client.views.open({
      token: context.botToken,
      trigger_id: payload.trigger_id,
      view: {
        type: "modal",
        callback_id: "fin_de_turno",
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        title: {
          type: "plain_text",
          text: "% efectivo de tiempo"
        },
        blocks: [
          {
            type: "input",
            block_id: "Porcentaje_activo",
            label: {
              type: "plain_text",
              text: "Ingresa el porcentaje efectivo de tiempo que corresponden a las tareas de pasantía:"
            },
            element: {
              type: "plain_text_input",
              action_id: "Porcentaje_activo",
              placeholder: {
                type: "plain_text",
                text: "E.G. 0.7"
              }
            }
          }
        ]
      }
    });
    //console.log(result);
  } catch (error) {
    console.error(error);
  }
});

app.view('fin_de_turno', async ({ ack, body, view,context, say }) => {
  //console.log(view);
  final = new Date()
  var fin_year = final.getFullYear();
  var fin_month = final.getMonth()+1; 
  var fin_day = final.getDate();
  var fin_hour = final.getHours();
  var fin_min = final.getMinutes();
  if (fin_hour<4)
  {
    fin_hour = 20 + fin_hour;
    fin_day -=1;
  } else 
  {
    fin_hour -=4;
  }
  if(fin_min<10)
  {
    hora_final = fin_hour + ":0" + fin_min;
  } else
  {
    hora_final = fin_hour + ":" + fin_min;
  }
  var fecha = fin_year + "/" + fin_month + "/" + fin_day;
  var message = view["state"]["values"]["Porcentaje_activo"]["Porcentaje_activo"]["value"];
  try {
    var info = await app.client.conversations.info({
      token: context.botToken, 
      channel: canal_fin
    });
    //console.log(info);
  } 
  catch (error) {
    console.error(error);
  }
  var channel_name = info.channel.name;
  //console.log("Channel name:" + channel_name)
  porcentaje = parseFloat(message);
  //console.log("Porcentaje:" + porcentaje)
  if (message.includes(".") == false) 
  {
    await ack({
      response_action: "errors",
      errors: {
        Porcentaje_activo: "Formato de respuesta no valido"
      }
    });
  }
  else if (isNaN(porcentaje) == true)
  {
    await ack({
      response_action: "errors",
      errors: {
        Porcentaje_activo: "Formato de respuesta no valido"
      }
    });    
  }
  else
  {
    ack();
    mongodb.connect(
    uri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function(err, client) 
    {
      var db = client.db("CIDIMEC");
      var Database = db.collection("Time_In/Out");
      Database.find({Usuario: usuario_final, Hora_final:''}).toArray(function(err,lista){
        if (err) throw err
        //console.log(lista)
        if (lista.length>0)
        {
          var ini=lista[0].Hora_inicio
          var ini_m=lista[0].Fecha_inicio
          var ini_array = ini.split(":");
          var inim_array = ini_m.split("/");
          var ini_hour = parseInt(ini_array[0], 10);
          var ini_min = parseInt(ini_array[1], 10);
          var ini_year = parseInt(inim_array[0],10);
          var ini_month = parseInt(inim_array[1],10);
          var ini_day = parseInt(inim_array[2],10);
        }
        var date1 = new Date(ini_year, ini_month-1, ini_day, ini_hour, ini_min, 0, 0);
        var date2 = new Date(fin_year, fin_month-1, fin_day, fin_hour, fin_min, 0, 0);
        console.log(date1);
        console.log(date2);
        var date11 = date1.getTime();
        var date22 = date2.getTime();
        var findate = (date22-date11)/60000;
        var horas_total = Math.floor(findate/60);
        var minutos_total = Math.round(((findate%60)+Number.EPSILON)*100)/100;
        var tiempo_efectivo = findate*porcentaje;
        var efect_hor = Math.floor(tiempo_efectivo/60);
        var efect_min = Math.round(((tiempo_efectivo%60)+Number.EPSILON)*100)/100;
        if(lista.length==1)
        {
          try
          {
            Database.findOneAndUpdate({Usuario: usuario_final, Hora_final:''}, {$set: {Fecha_final:fecha, Hora_final: hora_final, Tiempo_total:horas_total+"hrs. "+minutos_total+"min.", Porcentaje_efectivo:porcentaje, Tiempo_efectivo:efect_hor+"hrs. "+efect_min+"min."}});
          } catch (error) {
            console.error(error);
          }
          const result = app.client.chat.postMessage({
            token: context.botToken,
            channel: canal_fin,
            text: `Gracias <@${usuario_fin}>, su turno se finalizo correctamente`
          });
        }
        else if (lista.length<1)
        {
          const result = app.client.chat.postMessage({
            token: context.botToken,
            channel: canal_fin,
            text: `Lo siento <@${usuario_fin}>, no existe una sesion vigente con su usuario`
          });
        }
        else
        {
          const result = app.client.chat.postMessage({
            token: context.botToken,
            channel: canal_fin,
            text: `Lo siento <@${usuario_fin}>, existe mas de una sesion abierta con su usuario, contactese con su supervisor para solucionar el problema`
          });
        }
      });
    }
    )
  }
});

(async () => {

  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
