// migrate.js – COMPLETE EMBEDDED DATABASE FROM YOUR PROJECT
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ========== YOUR FULL DATABASE (from your first message) ==========
const databaseData = {
  "users": [
    {
      "id": "1706812345678",
      "username": "player1",
      "password": "hashed_password",
      "realBalance": 1000,
      "demoBalance": 50000,
      "depositTier": 1000,
      "gamesPlayed": 5,
      "withdrawalUnlocked": false
    },
    {
      "id": "1770044322204",
      "phone": "07082592946",
      "username": "Sage",
      "password": "$2b$10$69hQwqD1V48Zklc3E2SUoeV./8CHtyiP4qVlMoGpBSTXuoGYNgJxu",
      "realBalance": 2750,
      "demoBalance": 261550,
      "depositTier": 5000,
      "demoBonus": 250000,
      "currentBalanceMode": "real",
      "totalStakedReal": 24550,
      "totalStakedDemo": 1500,
      "totalWonReal": 67300,
      "totalWonDemo": 13050,
      "bankName": "Palmpay",
      "accountName": "Iyanda Isreal",
      "accountNumber": "7082592946",
      "withdrawalUnlocked": true,
      "gamesPlayed": 80,
      "createdAt": "2026-02-02T14:58:42.204Z",
      "lastGamePlayed": "2026-02-03T14:04:12.962Z"
    },
    {
      "id": "admin-1770052579051-admin",
      "phone": "0000000000",
      "username": "admin",
      "password": "$2b$10$LTbFu3.GRZGwHIWp49Uone99Ryiuv4irmmg4Oh5BfnfHyTtPixXPW",
      "realBalance": 0,
      "demoBalance": 0,
      "depositTier": null,
      "demoBonus": 0,
      "currentBalanceMode": "demo",
      "totalStakedReal": 0,
      "totalStakedDemo": 0,
      "totalWonReal": 0,
      "totalWonDemo": 0,
      "bankName": "",
      "accountName": "",
      "accountNumber": "",
      "withdrawalUnlocked": false,
      "gamesPlayed": 0,
      "isAdmin": true,
      "adminRole": "Main Admin",
      "createdAt": "2026-02-02T17:16:19.051Z"
    },
    {
      "id": "admin-1770052579395-manager",
      "phone": "0000000001",
      "username": "manager",
      "password": "$2b$10$01cmLqFk0RuDW/hAmcU/U.YvfkRAtpEMbSOpRdp20xl46JeU/rsxe",
      "realBalance": 0,
      "demoBalance": 0,
      "depositTier": null,
      "demoBonus": 0,
      "currentBalanceMode": "demo",
      "totalStakedReal": 0,
      "totalStakedDemo": 0,
      "totalWonReal": 0,
      "totalWonDemo": 0,
      "bankName": "",
      "accountName": "",
      "accountNumber": "",
      "withdrawalUnlocked": false,
      "gamesPlayed": 0,
      "isAdmin": true,
      "adminRole": "Manager",
      "createdAt": "2026-02-02T17:16:19.395Z"
    },
    {
      "id": "admin-1770052579810-support",
      "phone": "0000000002",
      "username": "support",
      "password": "$2b$10$eG2fBp1mphWgRr6knY4gkewGZge5tMJzX7MgMFYGHdB5qkhVOOATm",
      "realBalance": 0,
      "demoBalance": 0,
      "depositTier": null,
      "demoBonus": 0,
      "currentBalanceMode": "demo",
      "totalStakedReal": 0,
      "totalStakedDemo": 0,
      "totalWonReal": 0,
      "totalWonDemo": 0,
      "bankName": "",
      "accountName": "",
      "accountNumber": "",
      "withdrawalUnlocked": false,
      "gamesPlayed": 0,
      "isAdmin": true,
      "adminRole": "Support",
      "createdAt": "2026-02-02T17:16:19.811Z"
    },
    {
      "id": "1770128208315",
      "phone": "07082592945",
      "username": "testsite",
      "password": "$2b$10$JIHTZgR2LPhFGXoRwwYoTeOUrSr2vNz6ow9IVl9ziP4szoRTp0Ehe",
      "realBalance": 7350,
      "demoBalance": 50000,
      "depositTier": 1000,
      "demoBonus": 50000,
      "currentBalanceMode": "real",
      "totalStakedReal": 17350,
      "totalStakedDemo": 0,
      "totalWonReal": 23700,
      "totalWonDemo": 0,
      "bankName": "Palmpay",
      "accountName": "aasd",
      "accountNumber": "123456789",
      "withdrawalUnlocked": false,
      "gamesPlayed": 42,
      "createdAt": "2026-02-03T14:16:48.315Z",
      "lastGamePlayed": "2026-02-03T14:25:12.649Z"
    }
  ],
  "games": [
    {
      "id": "1770044371112",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,300,150,300,450,300,450,450,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T14:59:31.112Z"
    },
    {
      "id": "1770044375616",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,300,750,450,450,600,450,600,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T14:59:35.616Z"
    },
    {
      "id": "1770044382248",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,600,450,600,300,600,450,750,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T14:59:42.248Z"
    },
    {
      "id": "1770044387386",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [150,300,600,750,450,300,150,300,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T14:59:47.386Z"
    },
    {
      "id": "1770044400541",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [450,300,600,300,150,300,300,750,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:00:00.541Z"
    },
    {
      "id": "1770047280504",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,300,450,300,300,450,300,150,450],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:00.504Z"
    },
    {
      "id": "1770047288706",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,300,300,750,600,300,600,300,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:08.706Z"
    },
    {
      "id": "1770047293733",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 2250,
      "result": "win",
      "gridValues": [750,150,600,750,600,750,750,750,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:13.733Z"
    },
    {
      "id": "1770047300297",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 2250,
      "result": "win",
      "gridValues": [300,150,750,750,750,300,600,750,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:20.297Z"
    },
    {
      "id": "1770047303455",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [450,300,300,750,450,300,300,300,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:23.455Z"
    },
    {
      "id": "1770047312301",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,750,450,300,450,300,300,150,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:48:32.301Z"
    },
    {
      "id": "1770047888216",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,450,750,600,150,450,750,150,450],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:08.216Z"
    },
    {
      "id": "1770047897245",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,450,450,750,600,600,150,450,450],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:17.245Z"
    },
    {
      "id": "1770047906273",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [750,150,600,750,600,600,450,750,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:26.273Z"
    },
    {
      "id": "1770047916935",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 2250,
      "result": "win",
      "gridValues": [750,750,150,750,300,450,750,300,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:36.935Z"
    },
    {
      "id": "1770047924939",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [450,600,300,600,600,600,150,450,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:44.939Z"
    },
    {
      "id": "1770047932942",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,750,450,450,750,150,750,600,450],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:52.942Z"
    },
    {
      "id": "1770047938877",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [300,450,450,750,750,600,600,600,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:58:58.877Z"
    },
    {
      "id": "1770047945900",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [300,750,150,600,150,300,600,750,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:59:05.900Z"
    },
    {
      "id": "1770047952072",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [450,600,150,150,750,150,750,450,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:59:12.072Z"
    },
    {
      "id": "1770047957237",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [450,750,450,450,150,450,300,150,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:59:17.237Z"
    },
    {
      "id": "1770047962327",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 2250,
      "result": "win",
      "gridValues": [750,450,150,300,750,750,600,600,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T15:59:22.327Z"
    },
    {
      "id": "1770048749559",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [150,300,300,300,750,450,300,300,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:12:29.559Z"
    },
    {
      "id": "1770048761867",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [150,600,450,750,450,450,450,150,450],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:12:41.867Z"
    },
    {
      "id": "1770049111740",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [300,450,150,600,600,450,150,600,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:18:31.740Z"
    },
    {
      "id": "1770049599127",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [150,750,300,300,300,150,300,150,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:26:39.127Z"
    },
    {
      "id": "1770049602132",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [600,300,150,450,450,600,300,300,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:26:42.132Z"
    },
    {
      "id": "1770049651099",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [750,150,150,450,150,600,300,600,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:27:31.099Z"
    },
    {
      "id": "1770050035071",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,450,450,150,450,150,300,300,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:33:55.071Z"
    },
    {
      "id": "1770050037769",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [600,750,600,600,600,600,300,300,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:33:57.769Z"
    },
    {
      "id": "1770050042535",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [600,450,300,300,150,300,150,300,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:34:02.535Z"
    },
    {
      "id": "1770050045747",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [450,300,600,450,600,150,450,150,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:34:05.747Z"
    },
    {
      "id": "1770050461236",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 0,
      "result": "loss",
      "gridValues": [150,600,600,750,450,300,450,150,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:01.236Z"
    },
    {
      "id": "1770050463055",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [750,600,750,600,150,450,600,600,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:03.055Z"
    },
    {
      "id": "1770050465137",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1800,
      "result": "win",
      "gridValues": [600,150,600,150,450,300,600,600,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:05.137Z"
    },
    {
      "id": "1770050468278",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [300,600,150,750,450,150,450,300,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:08.278Z"
    },
    {
      "id": "1770050473971",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [600,300,300,450,450,750,750,750,300],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:13.971Z"
    },
    {
      "id": "1770050480971",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 900,
      "result": "win",
      "gridValues": [150,300,450,750,300,300,300,750,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:41:20.971Z"
    },
    {
      "id": "1770050701797",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [750,150,150,300,600,600,150,150,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:45:01.797Z"
    },
    {
      "id": "1770050709183",
      "userId": "1770044322204",
      "stake": 500,
      "winAmount": 4500,
      "result": "win",
      "gridValues": [500,1500,1500,1500,2500,1000,2000,1500,1500],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:45:09.183Z"
    },
    {
      "id": "1770050716098",
      "userId": "1770044322204",
      "stake": 500,
      "winAmount": 4500,
      "result": "win",
      "gridValues": [1500,2500,2000,2000,2000,500,1500,1500,500],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:45:16.098Z"
    },
    {
      "id": "1770051356343",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 450,
      "result": "win",
      "gridValues": [150,150,450,450,150,450,750,450,150],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:55:56.343Z"
    },
    {
      "id": "1770051366664",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 2250,
      "result": "win",
      "gridValues": [300,750,300,750,750,450,450,600,600],
      "scratchCount": 0,
      "createdAt": "2026-02-02T16:56:06.664Z"
    },
    {
      "id": "1770051811945",
      "userId": "1770044322204",
      "stake": 150,
      "winAmount": 1350,
      "result": "win",
      "gridValues": [750,450,750,750,750,300,450,450,750],
      "scratchCount": 0,
      "createdAt": "2026-02-02T17:03:31.945Z"
    },
    {
      "id": "1770051867378",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,450,450,150,150,300,300,150,150],
      "newBalance": 46900,
      "scratchCount": 0,
      "createdAt": "2026-02-02T17:04:27.378Z"
    },
    {
      "id": "1770052142311",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 2000,
      "result": "win",
      "gridValues": [3000,3000,3000,2000,2000,1000,2000,1000,2000],
      "newBalance": 47900,
      "scratchCount": 0,
      "createdAt": "2026-02-02T17:09:02.311Z"
    },
    {
      "id": "1770052148253",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,1000,1000,3000,2000,3000,3000,2000],
      "newBalance": 47900,
      "scratchCount": 0,
      "createdAt": "2026-02-02T17:09:08.253Z"
    },
    {
      "id": "1770116082354",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [450,300,150,450,150,150,450,150,300],
      "newBalance": 47900,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:54:42.354Z"
    },
    {
      "id": "1770116089743",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [300,150,150,450,300,450,300,150,150],
      "newBalance": 47900,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:54:49.743Z"
    },
    {
      "id": "1770116091817",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 450,
      "result": "win",
      "gridValues": [300,150,450,450,450,450,150,450,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:54:51.817Z"
    },
    {
      "id": "1770116094380",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [300,300,150,300,150,300,300,150,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:54:54.380Z"
    },
    {
      "id": "1770116100660",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,300,300,300,450,150,450,150,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:55:00.660Z"
    },
    {
      "id": "1770116102268",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,150,450,300,450,150,150,450,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:55:02.268Z"
    },
    {
      "id": "1770116109803",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [450,150,450,150,150,150,150,300,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:55:09.803Z"
    },
    {
      "id": "1770116155295",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,450,150,150,450,150,450,150,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:55:55.295Z"
    },
    {
      "id": "1770116157120",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,150,150,150,150,450,150,150,150],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:55:57.120Z"
    },
    {
      "id": "1770116168471",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,450,150,150,300,300,450,300,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:56:08.471Z"
    },
    {
      "id": "1770116172109",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [300,150,300,150,150,150,300,150,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:56:12.109Z"
    },
    {
      "id": "1770116174109",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [450,450,150,150,150,150,450,300,450],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:56:14.109Z"
    },
    {
      "id": "1770116249410",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,150,450,150,150,150,150,300,150],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:29.410Z"
    },
    {
      "id": "1770116254950",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,1000,1000,3000,3000,1000,2000,3000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:34.950Z"
    },
    {
      "id": "1770116258190",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,2000,2000,1000,1000,1000,2000,2000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:38.190Z"
    },
    {
      "id": "1770116263191",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [3000,2000,1000,2000,1000,1000,1000,3000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:43.191Z"
    },
    {
      "id": "1770116268278",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,3000,3000,1000,3000,1000,3000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:48.278Z"
    },
    {
      "id": "1770116275559",
      "userId": "1770044322204",
      "stake": 300,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [300,600,300,300,300,300,300,600,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:57:55.559Z"
    },
    {
      "id": "1770116280948",
      "userId": "1770044322204",
      "stake": 300,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [600,300,300,900,900,300,300,300,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:58:00.948Z"
    },
    {
      "id": "1770116286014",
      "userId": "1770044322204",
      "stake": 300,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [300,300,900,600,300,300,300,600,900],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:58:06.014Z"
    },
    {
      "id": "1770116293243",
      "userId": "1770044322204",
      "stake": 300,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [600,300,900,900,300,300,900,300,300],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:58:13.243Z"
    },
    {
      "id": "1770116339349",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [3000,1000,3000,1000,2000,1000,2000,1000,3000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:58:59.349Z"
    },
    {
      "id": "1770116342612",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,3000,3000,1000,1000,1000,3000,3000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:02.612Z"
    },
    {
      "id": "1770116347206",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [2000,3000,2000,2000,1000,1000,3000,1000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:07.206Z"
    },
    {
      "id": "1770116352236",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [3000,2000,1000,1000,1000,1000,1000,1000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:12.236Z"
    },
    {
      "id": "1770116354832",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,1000,1000,1000,1000,3000,1000,2000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:14.832Z"
    },
    {
      "id": "1770116359740",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [3000,1000,2000,1000,1000,2000,3000,1000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:19.740Z"
    },
    {
      "id": "1770116365340",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [1000,1000,1000,2000,1000,3000,1000,1000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:25.340Z"
    },
    {
      "id": "1770116370880",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1000,
      "result": "win",
      "gridValues": [3000,3000,2000,1000,1000,1000,2000,1000,1000],
      "newBalance": 48200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T10:59:30.880Z"
    },
    {
      "id": "1770120309904",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [1250,1250,50,1250,50,50,150,50,1250],
      "newBalance": 48100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T12:05:09.924Z",
      "matchingIndices": [2,4,5]
    },
    {
      "id": "1770120316970",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,150,50,1200,450,150,150,1200,150],
      "newBalance": 48100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T12:05:16.970Z",
      "matchingIndices": [0,1,5]
    },
    {
      "id": "1770120324867",
      "userId": "1770044322204",
      "stake": 1000,
      "mode": "real",
      "winAmount": 500,
      "result": "win",
      "gridValues": [500,500,500,2250,1750,500,300,1000,500],
      "newBalance": 47600,
      "scratchCount": 0,
      "createdAt": "2026-02-03T12:05:24.867Z",
      "matchingIndices": [0,1,2]
    },
    {
      "id": "1770127452962",
      "userId": "1770044322204",
      "stake": 150,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [300,100,1250,600,300,600,100,300,1250],
      "newBalance": 2750,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:04:12.962Z",
      "matchingIndices": [0,4,7]
    },
    {
      "id": "1770128284632",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 600,
      "result": "win",
      "gridValues": [50,1250,600,900,600,100,600,1250,600],
      "newBalance": 1450,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:18:04.632Z",
      "matchingIndices": [2,4,6]
    },
    {
      "id": "1770128286946",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [50,100,1200,100,600,100,600,100,900],
      "newBalance": 1400,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:18:06.946Z",
      "matchingIndices": [1,3,5]
    },
    {
      "id": "1770128383948",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [900,900,1250,1200,1200,300,300,300,300],
      "newBalance": 1550,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:19:43.948Z",
      "matchingIndices": [5,6,7]
    },
    {
      "id": "1770128387012",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 1250,
      "result": "win",
      "gridValues": [300,1200,50,1250,300,600,450,1250,1250],
      "newBalance": 2650,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:19:47.012Z",
      "matchingIndices": [3,7,8]
    },
    {
      "id": "1770128394141",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,900,150,900,900,150,450,50,150],
      "newBalance": 2650,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:19:54.141Z",
      "matchingIndices": [0,2,5]
    },
    {
      "id": "1770128398854",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [50,1250,1200,50,50,600,900,900,50],
      "newBalance": 2550,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:19:58.854Z",
      "matchingIndices": [0,3,4]
    },
    {
      "id": "1770128403764",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [100,100,1250,50,900,100,1200,600,300],
      "newBalance": 2500,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:03.764Z",
      "matchingIndices": [0,1,5]
    },
    {
      "id": "1770128408809",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [1200,50,300,450,900,300,900,300,150],
      "newBalance": 2650,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:08.809Z",
      "matchingIndices": [2,5,7]
    },
    {
      "id": "1770128413733",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [100,1250,600,100,150,100,150,1250,100],
      "newBalance": 2600,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:13.733Z",
      "matchingIndices": [0,3,5]
    },
    {
      "id": "1770128418928",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 1250,
      "result": "win",
      "gridValues": [900,1250,1250,600,450,1200,1250,600,50],
      "newBalance": 3700,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:18.928Z",
      "matchingIndices": [1,2,6]
    },
    {
      "id": "1770128442805",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 0,
      "result": "loss",
      "gridValues": [900,450,300,1250,450,1200,600,300,600],
      "newBalance": 3550,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:42.805Z",
      "matchingIndices": []
    },
    {
      "id": "1770128450452",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 0,
      "result": "loss",
      "gridValues": [450,900,50,100,900,300,1250,100,1200],
      "newBalance": 3400,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:50.452Z",
      "matchingIndices": []
    },
    {
      "id": "1770128453377",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [300,150,450,900,900,50,300,50,50],
      "newBalance": 3300,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:53.377Z",
      "matchingIndices": [5,7,8]
    },
    {
      "id": "1770128456647",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [100,100,900,1200,300,450,1250,100,50],
      "newBalance": 3250,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:56.647Z",
      "matchingIndices": [0,1,7]
    },
    {
      "id": "1770128459656",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [100,50,50,1200,50,450,900,50,150],
      "newBalance": 3150,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:20:59.657Z",
      "matchingIndices": [1,2,4]
    },
    {
      "id": "1770128462436",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [300,1200,1250,600,100,100,100,150,1200],
      "newBalance": 3100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:02.436Z",
      "matchingIndices": [4,5,6]
    },
    {
      "id": "1770128468699",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [150,150,100,1200,900,300,450,100,100],
      "newBalance": 3050,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:08.699Z",
      "matchingIndices": [2,7,8]
    },
    {
      "id": "1770128473624",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,50,900,150,150,1250,150,100,600],
      "newBalance": 3050,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:13.624Z",
      "matchingIndices": [0,3,4]
    },
    {
      "id": "1770128478232",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [900,150,450,150,100,150,150,1200,150],
      "newBalance": 3050,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:18.232Z",
      "matchingIndices": [1,3,5]
    },
    {
      "id": "1770128483345",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 100,
      "result": "win",
      "gridValues": [1200,100,300,50,100,50,100,100,150],
      "newBalance": 3000,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:23.345Z",
      "matchingIndices": [1,4,6]
    },
    {
      "id": "1770128487909",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 0,
      "result": "loss",
      "gridValues": [1250,600,1200,1250,1200,100,150,50,900],
      "newBalance": 2850,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:21:27.909Z",
      "matchingIndices": []
    },
    {
      "id": "1770128523852",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [1200,50,1250,50,600,150,50,50,50],
      "newBalance": 2750,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:03.852Z",
      "matchingIndices": [1,3,6]
    },
    {
      "id": "1770128529160",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 0,
      "result": "loss",
      "gridValues": [50,600,1200,1250,100,1200,100,50,150],
      "newBalance": 2600,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:09.160Z",
      "matchingIndices": []
    },
    {
      "id": "1770128531823",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 900,
      "result": "win",
      "gridValues": [900,600,50,50,900,900,1250,150,150],
      "newBalance": 3350,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:11.823Z",
      "matchingIndices": [0,4,5]
    },
    {
      "id": "1770128538319",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1500,
      "result": "win",
      "gridValues": [300,500,1750,1500,750,1500,750,1500,2000],
      "newBalance": 3850,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:18.319Z",
      "matchingIndices": [3,5,7]
    },
    {
      "id": "1770128543176",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 2250,
      "result": "win",
      "gridValues": [2250,2250,2250,2250,1750,750,750,2250,2250],
      "newBalance": 5100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:23.176Z",
      "matchingIndices": [0,1,2]
    },
    {
      "id": "1770128547717",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 2000,
      "result": "win",
      "gridValues": [1500,2000,1750,300,2000,2250,2250,2000,2000],
      "newBalance": 6100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:27.717Z",
      "matchingIndices": [1,4,7]
    },
    {
      "id": "1770128552798",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 750,
      "result": "win",
      "gridValues": [1250,1500,750,750,300,750,300,750,750],
      "newBalance": 5850,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:32.798Z",
      "matchingIndices": [2,3,5]
    },
    {
      "id": "1770128558444",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1750,
      "result": "win",
      "gridValues": [1750,1000,2250,2000,1500,750,1750,1750,1750],
      "newBalance": 6600,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:38.444Z",
      "matchingIndices": [0,6,7]
    },
    {
      "id": "1770128564263",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 0,
      "result": "loss",
      "gridValues": [1000,1250,500,1750,500,1250,750,2000,300],
      "newBalance": 5600,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:44.263Z",
      "matchingIndices": []
    },
    {
      "id": "1770128566377",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [300,2250,2000,300,300,2000,300,2250,1000],
      "newBalance": 4900,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:46.377Z",
      "matchingIndices": [0,3,4]
    },
    {
      "id": "1770128571963",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 2000,
      "result": "win",
      "gridValues": [2000,750,2000,1000,2000,750,1500,2000,2000],
      "newBalance": 5900,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:51.963Z",
      "matchingIndices": [0,2,4]
    },
    {
      "id": "1770128577488",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 500,
      "result": "win",
      "gridValues": [750,750,750,2250,1000,500,1000,500,500],
      "newBalance": 5400,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:22:57.488Z",
      "matchingIndices": [5,7,8]
    },
    {
      "id": "1770128583075",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 750,
      "result": "win",
      "gridValues": [1500,2250,2000,750,750,2250,750,300,1000],
      "newBalance": 5150,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:23:03.075Z",
      "matchingIndices": [3,4,6]
    },
    {
      "id": "1770128591143",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [2250,300,500,300,1250,2250,2250,2250,300],
      "newBalance": 4450,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:23:11.143Z",
      "matchingIndices": [1,3,8]
    },
    {
      "id": "1770128602001",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 1500,
      "result": "win",
      "gridValues": [1000,1500,2000,1250,1500,300,750,1500,2000],
      "newBalance": 4950,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:23:22.001Z",
      "matchingIndices": [1,4,7]
    },
    {
      "id": "1770128610426",
      "userId": "1770128208315",
      "stake": 1000,
      "mode": "real",
      "winAmount": 2250,
      "result": "win",
      "gridValues": [1750,2250,300,2250,1250,500,300,750,2250],
      "newBalance": 6200,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:23:30.426Z",
      "matchingIndices": [1,3,8]
    },
    {
      "id": "1770128702682",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 50,
      "result": "win",
      "gridValues": [50,50,50,1250,300,450,50,100,450],
      "newBalance": 6100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:25:02.682Z",
      "matchingIndices": [0,1,2]
    },
    {
      "id": "1770128704913",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,1200,150,150,50,900,100,450,300],
      "newBalance": 6100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:25:04.913Z",
      "matchingIndices": [0,2,3]
    },
    {
      "id": "1770128707986",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 150,
      "result": "win",
      "gridValues": [150,150,450,100,450,150,100,900,600],
      "newBalance": 6100,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:25:07.986Z",
      "matchingIndices": [0,1,5]
    },
    {
      "id": "1770128710198",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 300,
      "result": "win",
      "gridValues": [600,300,50,50,450,1250,300,300,1250],
      "newBalance": 6250,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:25:10.198Z",
      "matchingIndices": [1,6,7]
    },
    {
      "id": "1770128712649",
      "userId": "1770128208315",
      "stake": 150,
      "mode": "real",
      "winAmount": 1250,
      "result": "win",
      "gridValues": [100,1250,1250,1200,450,100,1250,1250,900],
      "newBalance": 7350,
      "scratchCount": 0,
      "createdAt": "2026-02-03T14:25:12.649Z",
      "matchingIndices": [1,2,6]
    }
  ],
  "withdrawals": [
    {
      "id": "1770116425023",
      "userId": "1770044322204",
      "amount": 40000,
      "status": "approved",
      "bankName": "Palmpay",
      "accountName": "Iyanda Isreal",
      "accountNumber": "7082592946",
      "createdAt": "2026-02-03T11:00:25.023Z",
      "approvedAt": "2026-02-03T11:53:15.163Z",
      "notes": "Approved by admin"
    },
    {
      "id": "1770120392993",
      "userId": "1770044322204",
      "amount": 45000,
      "status": "approved",
      "bankName": "Palmpay",
      "accountName": "Iyanda Isreal",
      "accountNumber": "7082592946",
      "createdAt": "2026-02-03T12:06:32.993Z",
      "approvedAt": "2026-02-03T12:06:48.821Z",
      "notes": "Approved by admin"
    }
  ],
  "deposits": [
    {
      "id": "1770046377344",
      "userId": "1770044322204",
      "username": "Sage",
      "amount": 5000,
      "paymentProof": "Bank Transfer - Awaiting verification",
      "status": "approved",
      "createdAt": "2026-02-02T15:32:57.344Z",
      "approvedAt": "2026-02-02T15:47:45.302Z",
      "adminNotes": "Approved by admin"
    },
    {
      "id": "1770128251393",
      "userId": "1770128208315",
      "username": "testsite",
      "amount": 1000,
      "paymentProof": "Bank Transfer - Awaiting verification",
      "status": "approved",
      "createdAt": "2026-02-03T14:17:31.393Z",
      "approvedAt": "2026-02-03T14:17:56.977Z",
      "adminNotes": "Approved by admin"
    }
  ],
  "settings": {
    "audioEnabled": true
  }
};

// ========== MIGRATION LOGIC ==========
async function migrate() {
  console.log('🚀 Starting migration to Supabase...');

  // Insert users
  if (databaseData.users?.length) {
    const { error } = await supabase.from('users').upsert(databaseData.users, { onConflict: 'id' });
    if (error) console.error('❌ Users error:', error);
    else console.log(`✅ Migrated ${databaseData.users.length} users`);
  }

  // Insert games
  if (databaseData.games?.length) {
    const { error } = await supabase.from('games').upsert(databaseData.games, { onConflict: 'id' });
    if (error) console.error('❌ Games error:', error);
    else console.log(`✅ Migrated ${databaseData.games.length} games`);
  }

  // Insert withdrawals
  if (databaseData.withdrawals?.length) {
    const { error } = await supabase.from('withdrawals').upsert(databaseData.withdrawals, { onConflict: 'id' });
    if (error) console.error('❌ Withdrawals error:', error);
    else console.log(`✅ Migrated ${databaseData.withdrawals.length} withdrawals`);
  }

  // Insert deposits
  if (databaseData.deposits?.length) {
    const { error } = await supabase.from('deposits').upsert(databaseData.deposits, { onConflict: 'id' });
    if (error) console.error('❌ Deposits error:', error);
    else console.log(`✅ Migrated ${databaseData.deposits.length} deposits`);
  }

  // Settings
  if (databaseData.settings) {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...databaseData.settings }, { onConflict: 'id' });
    if (error) console.error('❌ Settings error:', error);
    else console.log('✅ Migrated settings');
  }

  console.log('🎉 Migration complete!');
}

migrate().catch(console.error);