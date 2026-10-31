require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json({limit:"10kb"}));
app.use(express.static(path.join(__dirname,"Foxy_Client_Website_v2")));

const webhook = process.env.DISCORD_WEBHOOK_URL;
app.post("/api/order", async (req,res) => {
  try {
    const {plan, method, discordName, ipConsent} = req.body || {};
    const allowedPlans = ["7 Days — 30 zl","1 Month — 80 zl","Lifetime — 150 zl"];
    const allowedMethods = ["Litecoin","Kod PSC","myPSC","Kod BLIK"];
    if (!allowedPlans.includes(plan) || !allowedMethods.includes(method) ||
        typeof discordName !== "string" || !discordName.trim() || discordName.length > 80) {
      return res.status(400).json({error:"Nieprawidlowe dane zamowienia."});
    }
    if (!webhook || !webhook.startsWith("https://discord.com/api/webhooks/")) {
      return res.status(503).json({error:"Brak konfiguracji webhooka na serwerze."});
    }
    const code = String(crypto.randomInt(0,1000000)).padStart(6,"0");
    const fields = [
      {name:"Kod zamowienia",value:"`"+code+"`",inline:true},
      {name:"Wybrany plan",value:plan,inline:true},
      {name:"Metoda platnosci",value:method,inline:true},
      {name:"Discord",value:discordName.trim(),inline:false}
    ];
    if (ipConsent === true) {
      const forwarded = req.headers["x-forwarded-for"];
      const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
      fields.push({name:"Adres IP (zgoda udzielona)",value:"`"+ip.slice(0,100)+"`",inline:true});
    } else {
      fields.push({name:"Adres IP",value:"Nie wyslano — brak zgody",inline:true});
    }
    const payload = {
      username: "Foxy Client Orders",
      embeds: [{
        title: "Nowe zamowienie Foxy Client",
        color: 10181046,
        fields,
        timestamp: new Date().toISOString()
      }]
    };
    const hookResponse = await fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if (!hookResponse.ok) {
      console.error("Discord webhook error:",hookResponse.status);
      return res.status(502).json({error:"Discord nie przyjal zamowienia. Sprobuj ponownie pozniej."});
    }
    res.json({code,plan,method});
  } catch (e) {
    console.error(e);
    res.status(500).json({error:"Blad serwera."});
  }
});
// Wizyta: adres IP jest wysylany tylko po wyraznej zgodzie uzytkownika.
app.post("/api/visit-consent", async (req,res) => {
  try {
    if (req.body?.consent !== true) return res.status(400).json({error:"Consent required"});
    if (!webhook || !webhook.startsWith("https://discord.com/api/webhooks/"))
      return res.status(503).json({error:"Webhook not configured"});
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
    const ua = String(req.headers["user-agent"] || "unknown").slice(0,300);
    const payload = {
      username: "Foxy Client Visits",
      embeds: [{
        title: "Zgoda na zapis danych wizyty",
        color: 10181046,
        fields: [
          {name:"Adres IP",value:"`"+ip.slice(0,100)+"`",inline:true},
          {name:"User-Agent",value:ua.slice(0,1000),inline:false},
          {name:"Zgoda",value:"Udzielona przez formularz na stronie",inline:true}
        ],
        timestamp: new Date().toISOString()
      }]
    };
    const sent = await fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if (!sent.ok) return res.status(502).json({error:"Webhook failed"});
    res.json({ok:true});
  } catch(err) {
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});

const port = process.env.PORT || 3000;
app.listen(port,()=>console.log(`Foxy Client website: http://localhost:${port}`));
