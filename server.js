const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ✅ Import the notification utility (assumes notify.js is in same folder)
const addNotification = require('./notify');

const app = express();
app.use(cors());
app.use(express.json());

// ========== STATIC FILES ==========
app.use(express.static(path.join(__dirname, 'public')));

console.log('📁 Current directory:', __dirname);
console.log('📄 Files in dir:', require('fs').readdirSync(__dirname));

// ========== SUPABASE CLIENTS ==========
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ========== WIN RATE CONFIGURATION ==========
const WIN_CAP_RATIO = 0.20; // 10% max wins per total games played for normal users

// ========== REFERRAL CODE GENERATOR ==========
function generateReferralCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueReferralCode() {
  let code;
  let exists = true;
  while (exists) {
    code = generateReferralCode();
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();
    exists = !!data;
  }
  return code;
}

// ========== GAME LOGIC ==========
class GameLogic {
  constructor() {
    this.sections = {
      'A': { minStake: 150, maxWin: 2250 },
      'B': { minStake: 300, maxWin: 7500 },
      'C': { minStake: 500, maxWin: 10000 },
      'D': { minStake: 1000, maxWin: 15000 }
    };
    
    // Normal probabilities (low win rate)
    this.probabilities = {
      demo: {
        'A': { winChance: 0.95, amounts: [150, 300, 450, 600, 750] },
        'B': { winChance: 0.95, amounts: [300, 600, 900, 1200, 1500] },
        'C': { winChance: 0.95, amounts: [500, 1000, 1500, 2000, 2500] },
        'D': { winChance: 0.95, amounts: [1000, 2000, 3000, 4000, 5000] }
      },
      real: {
        'A': { winChance: 0.2, amounts: [50, 100, 150, 300, 450, 600] },
        'B': { winChance: 0.2, amounts: [100, 200, 300, 500, 750] },
        'C': { winChance: 0.2, amounts: [150, 300, 500, 750, 1000] },
        'D': { winChance: 0.2, amounts: [300, 500, 750, 900, 1050] }
      }
    };
    
    // Promoter probabilities (high win rate)
    this.promoterProbabilities = {
      demo: {
        'A': { winChance: 0.9, amounts: [1500, 3000, 4050, 6000, 7050] },
        'B': { winChance: 0.9, amounts: [3000, 6000, 9000, 10200, 10500] },
        'C': { winChance: 0.9, amounts: [5000, 10000, 10500, 20000, 20500] },
        'D': { winChance: 0.9, amounts: [10000, 20000, 30000, 40000, 50000] }
      },
      real: {
        'A': { winChance: 0.75, amounts: [510, 1000, 1500, 3000, 4050, 6000] },
        'B': { winChance: 0.75, amounts: [1000, 2000, 3000, 5000, 7050] },
        'C': { winChance: 0.75, amounts: [1050, 3000, 5000, 7050, 10000] },
        'D': { winChance: 0.75, amounts: [3000, 5000, 7050, 9000, 10050] }
      }
    };
  }

  getSectionFromStake(stake) {
    for (const [section, data] of Object.entries(this.sections)) {
      if (stake === data.minStake) return section;
    }
    return 'A';
  }

  generateGrid(section, mode = 'demo', isPromoter = false) {
    const probs = isPromoter ? this.promoterProbabilities : this.probabilities;
    const sectionProb = probs[mode][section];
    const grid = [];
    for (let i = 0; i < 9; i++) {
      grid.push(sectionProb.amounts[Math.floor(Math.random() * sectionProb.amounts.length)]);
    }
    return grid;
  }

  generateGridNoWin(section, mode, isPromoter = false) {
    const probs = isPromoter ? this.promoterProbabilities : this.probabilities;
    const amounts = probs[mode][section].amounts;
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const grid = [];
      for (let i = 0; i < 9; i++) {
        grid.push(amounts[Math.floor(Math.random() * amounts.length)]);
      }
      
      const counts = {};
      let hasTriple = false;
      for (let val of grid) {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] >= 3) {
          hasTriple = true;
          break;
        }
      }
      
      if (!hasTriple) return grid;
    }
    
    // Fallback
    const grid = [];
    for (let i = 0; i < 9; i++) {
      grid.push(amounts[Math.floor(Math.random() * amounts.length)]);
    }
    
    const counts = {};
    for (let val of grid) counts[val] = (counts[val] || 0) + 1;
    
    for (let val in counts) {
      if (counts[val] >= 3) {
        const indices = [];
        grid.forEach((v, idx) => { if (v == val) indices.push(idx); });
        let newVal;
        do {
          newVal = amounts[Math.floor(Math.random() * amounts.length)];
        } while (newVal == val);
        grid[indices[2]] = newVal;
        break;
      }
    }
    
    return grid;
  }

  checkForWin(grid) {
    const counts = {};
    grid.forEach(amount => { counts[amount] = (counts[amount] || 0) + 1; });
    for (const [amount, count] of Object.entries(counts)) {
      if (count >= 3) {
        const amountNum = parseInt(amount);
        const indices = [];
        grid.forEach((value, index) => { if (value === amountNum) indices.push(index); });
        return { isWin: true, winAmount: amountNum, matchingIndices: indices.slice(0, 3) };
      }
    }
    return { isWin: false, winAmount: 0, matchingIndices: [] };
  }

  determineWin(section, mode, isPromoter = false) {
    const probs = isPromoter ? this.promoterProbabilities : this.probabilities;
    return Math.random() < probs[mode][section].winChance;
  }

  applyProbabilityToGrid(grid, section, mode, isPromoter = false) {
    if (this.determineWin(section, mode, isPromoter)) {
      const probs = isPromoter ? this.promoterProbabilities : this.probabilities;
      const amounts = probs[mode][section].amounts;
      let winAmount;
      if (mode === 'real') {
        if (Math.random() < 0.7) {
          winAmount = amounts[Math.floor(Math.random() * Math.min(4, amounts.length))];
        } else {
          winAmount = amounts[Math.floor(Math.random() * amounts.length)];
        }
      } else {
        winAmount = amounts[Math.floor(Math.random() * amounts.length)];
      }
      const positions = [0,1,2,3,4,5,6,7,8];
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      grid[positions[0]] = winAmount;
      grid[positions[1]] = winAmount;
      grid[positions[2]] = winAmount;
    }
    return grid;
  }
}

const gameLogic = new GameLogic();

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ success: false, message: "No token" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  try {
    const secret = process.env.JWT_SECRET || "dev_secret_123";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ========== ADMIN MIDDLEWARE ==========
const adminMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ success: false, message: "No token" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  try {
    const secret = process.env.JWT_SECRET || "dev_secret_123";
    const decoded = jwt.verify(token, secret);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('isAdmin, adminRole')
      .eq('id', decoded.id)
      .single();
    if (error || !user || !user.isAdmin) {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    req.admin = { ...decoded, role: user.adminRole };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid admin token" });
  }
};

// ========== INIT ADMIN ACCOUNTS ==========
async function initializeAdminAccounts() {
  const adminAccounts = [
    { username: "admin", password: "admin123", name: "Main Admin", phone: "0000000000" },
    { username: "manager", password: "manager123", name: "Manager", phone: "0000000001" },
    { username: "support", password: "support123", name: "Support", phone: "0000000002" }
  ];

  for (const acc of adminAccounts) {
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', acc.username)
      .maybeSingle();

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(acc.password, salt);
      const referralCode = await getUniqueReferralCode();
      const newAdmin = {
        id: `admin-${Date.now()}-${acc.username}`,
        phone: acc.phone,
        username: acc.username,
        password: hashedPassword,
        realBalance: 0,
        demoBalance: 0,
        depositTier: null,
        demoBonus: 0,
        currentBalanceMode: 'demo',
        totalStakedReal: 0,
        totalStakedDemo: 0,
        totalWonReal: 0,
        totalWonDemo: 0,
        bankName: '',
        accountName: '',
        accountNumber: '',
        withdrawalUnlocked: false,
        gamesPlayed: 0,
        totalWins: 0,
        isAdmin: true,
        adminRole: acc.name,
        createdAt: new Date().toISOString(),
        referral_code: referralCode,
        referred_by: null,
        referral_earnings: 0,
        total_referral_deposits: 0,
        is_promoter: false
      };
      await supabaseAdmin.from('users').insert(newAdmin);
      console.log(`✅ Created admin: ${acc.username} with referral code ${referralCode}`);
    }
  }
}

setTimeout(() => initializeAdminAccounts(), 1000);

// ========== ROOT ROUTE ==========
app.get("/", (req, res) => {
  res.json({ success: true, message: "Scratch & Win API", database: "Supabase" });
});

// ========== AUTH ROUTES ==========
app.post("/auth/register", async (req, res) => {
  try {
    const { phone, username, password, referralCode } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`phone.eq.${phone},username.eq.${username}`)
      .maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: "User exists" });

    let referrer = null;
    if (referralCode) {
      const { data: refUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('referral_code', referralCode)
        .maybeSingle();
      if (!refUser) {
        return res.status(400).json({ success: false, message: "Invalid referral code" });
      }
      referrer = refUser;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = await getUniqueReferralCode();
    const id = Date.now().toString();

    const user = {
      id,
      phone,
      username,
      password: hashedPassword,
      realBalance: 0,
      demoBalance: 46800,
      depositTier: null,
      demoBonus: 0,
      currentBalanceMode: 'demo',
      totalStakedReal: 0,
      totalStakedDemo: 0,
      totalWonReal: 0,
      totalWonDemo: 0,
      bankName: '',
      accountName: '',
      accountNumber: '',
      withdrawalUnlocked: false,
      gamesPlayed: 0,
      totalWins: 0,
      createdAt: new Date().toISOString(),
      referral_code: newReferralCode,
      referred_by: referrer ? referrer.id : null,
      referral_earnings: 0,
      total_referral_deposits: 0,
      is_promoter: false
    };

    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;

    if (referrer) {
      const referralRecord = {
        id: Date.now().toString() + '-ref',
        referrer_id: referrer.id,
        referred_id: user.id,
        referred_username: user.username,
        referred_at: new Date().toISOString(),
        total_deposited: 0,
        commission_earned: 0
      };
      await supabase.from('referrals').insert(referralRecord);
    }

    const token = jwt.sign(
      { id: user.id, username },
      process.env.JWT_SECRET || "dev_secret_123",
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Registered",
      token,
      user: {
        id: user.id,
        username,
        balance: 0,
        demoBalance: 46800,
        referralCode: newReferralCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    if (error || !user) return res.status(400).json({ success: false, message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET || "dev_secret_123", { expiresIn: "30d" });
    res.json({
      success: true,
      message: "Logged in",
      token,
      user: { id: user.id, username, balance: user.realBalance, demoBalance: user.demoBalance }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== USER ROUTES ==========
app.get("/user/me", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, realBalance, demoBalance, depositTier, currentBalanceMode, totalStakedReal, totalStakedDemo, totalWins, is_promoter')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        balance: user.realBalance || 0,
        demoBalance: user.demoBalance || 46800,
        depositTier: user.depositTier,
        currentBalanceMode: user.currentBalanceMode || 'demo',
        totalStakedReal: user.totalStakedReal || 0,
        totalStakedDemo: user.totalStakedDemo || 0,
        totalWins: user.totalWins || 0,
        isPromoter: user.is_promoter || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/user/switch-balance-mode", authMiddleware, async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['demo', 'real'].includes(mode)) return res.status(400).json({ success: false, message: "Invalid mode" });

    const { error } = await supabase
      .from('users')
      .update({ currentBalanceMode: mode })
      .eq('id', req.user.id);
    if (error) throw error;

    const { data: user } = await supabase
      .from('users')
      .select('demoBalance, realBalance')
      .eq('id', req.user.id)
      .single();
    const currentBalance = mode === 'demo' ? user.demoBalance : user.realBalance;
    res.json({ success: true, message: `Switched to ${mode}`, mode, currentBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/user/save-bank-details", authMiddleware, async (req, res) => {
  try {
    const { bankName, accountName, accountNumber } = req.body;
    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ success: false, message: "All details required" });
    }
    const { error } = await supabase
      .from('users')
      .update({ bankName, accountName, accountNumber })
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: "Bank details saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== GAME ROUTES ==========
app.post("/game/play", authMiddleware, async (req, res) => {
  try {
    const { stake, mode = 'demo' } = req.body;
    if (![150, 300, 500, 1000].includes(stake)) return res.status(400).json({ success: false, message: "Invalid stake" });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    const balance = mode === 'demo' ? user.demoBalance : user.realBalance;
    if (balance < stake) return res.status(400).json({ success: false, message: `Insufficient ${mode} balance` });

    // ---------- WIN CAP CHECK (SKIP FOR PROMOTERS) ----------
    const gamesPlayed = user.gamesPlayed || 0;
    const totalWins = user.totalWins || 0;
    const maxWinsAfterThisGame = Math.floor((gamesPlayed + 1) * WIN_CAP_RATIO);
    const forcedLoss = !user.is_promoter && (totalWins >= maxWinsAfterThisGame);

    const section = gameLogic.getSectionFromStake(stake);

    // Generate grid without triples for real mode
    let grid;
    if (mode === 'real') {
      grid = gameLogic.generateGridNoWin(section, mode, user.is_promoter);
    } else {
      grid = gameLogic.generateGrid(section, mode, user.is_promoter);
    }

    // Apply probability-based win only if not forced to lose
    let result;
    if (!forcedLoss) {
      grid = gameLogic.applyProbabilityToGrid(grid, section, mode, user.is_promoter);
      result = gameLogic.checkForWin(grid);
    } else {
      result = { isWin: false, winAmount: 0, matchingIndices: [] };
    }

    // Prepare updates
    let updates = {};
    let gameRecord = {
      id: Date.now().toString(),
      userId: user.id,
      stake,
      mode,
      winAmount: result.winAmount,
      result: result.isWin ? "win" : "loss",
      gridValues: grid,
      scratchCount: 0,
      createdAt: new Date().toISOString(),
      matchingIndices: result.matchingIndices || []
    };

    if (mode === 'demo') {
      updates.demoBalance = user.demoBalance - stake;
      updates.totalStakedDemo = (user.totalStakedDemo || 0) + stake;
      if (result.isWin) {
        updates.demoBalance = updates.demoBalance + result.winAmount;
        updates.totalWonDemo = (user.totalWonDemo || 0) + result.winAmount;
      }
    } else {
      updates.realBalance = user.realBalance - stake;
      updates.totalStakedReal = (user.totalStakedReal || 0) + stake;
      if (result.isWin) {
        updates.realBalance = updates.realBalance + result.winAmount;
        updates.totalWonReal = (user.totalWonReal || 0) + result.winAmount;
      }
    }
    updates.gamesPlayed = gamesPlayed + 1;
    updates.lastGamePlayed = new Date().toISOString();
    updates.totalWins = totalWins + (result.isWin ? 1 : 0);

    // Apply updates
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    if (updateError) throw updateError;

    // Fetch new balance
    const { data: updatedUser } = await supabase
      .from('users')
      .select('demoBalance, realBalance')
      .eq('id', user.id)
      .single();

    gameRecord.newBalance = mode === 'demo' ? updatedUser.demoBalance : updatedUser.realBalance;
    const { error: gameError } = await supabase.from('games').insert(gameRecord);
    if (gameError) throw gameError;

    res.json({
      success: true,
      message: result.isWin ? "You won! 🎉" : "Try again!",
      winAmount: result.winAmount,
      isWin: result.isWin,
      gridValues: grid,
      matchingIndices: result.matchingIndices,
      newBalance: mode === 'demo' ? updatedUser.demoBalance : updatedUser.realBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Game error" });
  }
});

// ========== AUTO PLAY ==========
app.post("/game/auto-play", authMiddleware, async (req, res) => {
  try {
    const { stake, mode = 'demo', count } = req.body;
    if (![150, 300, 500, 1000].includes(stake)) {
      return res.status(400).json({ success: false, message: "Invalid stake" });
    }
    if (!count || count < 1 || count > 500) {
      return res.status(400).json({ success: false, message: "Count must be between 1 and 500" });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const balanceField = mode === 'demo' ? 'demoBalance' : 'realBalance';
    const balance = mode === 'demo' ? user.demoBalance : user.realBalance;

    // Check sufficient balance
    if (balance < stake * count) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₦${(stake * count).toLocaleString()}, you have ₦${balance.toLocaleString()}`
      });
    }

    // Working copies
    let currentBalance = balance;
    let currentGamesPlayed = user.gamesPlayed || 0;
    let currentTotalWins = user.totalWins || 0;
    let totalStaked = 0;
    let totalWon = 0;
    let wins = 0;
    const games = [];

    // Process each play
    for (let i = 0; i < count; i++) {
      // Cap check (skip for promoters)
      const maxWinsAfterThisGame = Math.floor((currentGamesPlayed + 1) * WIN_CAP_RATIO);
      const forcedLoss = !user.is_promoter && (currentTotalWins >= maxWinsAfterThisGame);

      const section = gameLogic.getSectionFromStake(stake);
      
      // Generate grid without triples for real mode
      let grid;
      if (mode === 'real') {
        grid = gameLogic.generateGridNoWin(section, mode, user.is_promoter);
      } else {
        grid = gameLogic.generateGrid(section, mode, user.is_promoter);
      }

      // Apply win chance only if not forced to lose
      let result;
      if (!forcedLoss) {
        grid = gameLogic.applyProbabilityToGrid(grid, section, mode, user.is_promoter);
        result = gameLogic.checkForWin(grid);
      } else {
        result = { isWin: false, winAmount: 0, matchingIndices: [] };
      }

      totalStaked += stake;
      if (result.isWin) {
        totalWon += result.winAmount;
        wins++;
        currentBalance += result.winAmount;
        currentTotalWins++;
      }
      currentBalance -= stake;
      currentGamesPlayed++;

      // Record game
      games.push({
        id: `${Date.now()}-${i}-${user.id}`,
        userId: user.id,
        stake,
        mode,
        winAmount: result.winAmount,
        result: result.isWin ? "win" : "loss",
        gridValues: grid,
        scratchCount: 0,
        createdAt: new Date().toISOString(),
        matchingIndices: result.matchingIndices || [],
        newBalance: currentBalance
      });
    }

    // Prepare user updates
    const updates = {};
    if (mode === 'demo') {
      updates.demoBalance = currentBalance;
      updates.totalStakedDemo = (user.totalStakedDemo || 0) + totalStaked;
      updates.totalWonDemo = (user.totalWonDemo || 0) + totalWon;
    } else {
      updates.realBalance = currentBalance;
      updates.totalStakedReal = (user.totalStakedReal || 0) + totalStaked;
      updates.totalWonReal = (user.totalWonReal || 0) + totalWon;
    }
    updates.gamesPlayed = currentGamesPlayed;
    updates.lastGamePlayed = new Date().toISOString();
    updates.totalWins = currentTotalWins;

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    if (updateError) throw updateError;

    // Insert all games
    const { error: insertError } = await supabase
      .from('games')
      .insert(games);
    if (insertError) throw insertError;

    // Return summary
    res.json({
      success: true,
      message: `✅ Played ${count} games. Wins: ${wins}, Total win: ₦${totalWon.toLocaleString()}, Net: ₦${(totalWon - totalStaked).toLocaleString()}`,
      newBalance: currentBalance,
      totalStaked,
      totalWon,
      wins,
      games: games.slice(-3)
    });
  } catch (error) {
    console.error("❌ Auto-play error:", error);
    res.status(500).json({ success: false, message: "Auto-play server error" });
  }
});

app.get("/user/game-history", authMiddleware, async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('userId', req.user.id)
      .order('createdAt', { ascending: false })
      .limit(50);
    if (error) throw error;

    const history = games.map(game => ({
      id: game.id,
      stake: game.stake,
      mode: game.mode || 'demo',
      gridValues: game.gridValues || [],
      winAmount: game.winAmount || 0,
      isWin: game.result === "win",
      newBalance: game.newBalance || 0,
      timestamp: game.createdAt,
      matchingIndices: game.matchingIndices || []
    }));

    res.json({ success: true, count: history.length, history });
  } catch (error) {
    console.error("Game history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== DEPOSIT ROUTES ==========
app.get("/deposit/has-tier", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('depositTier, demoBalance')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, hasTier: !!user.depositTier, tier: user.depositTier, demoBalance: user.demoBalance || 46800 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/deposit/select-tier", authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body;
    const bonuses = { 1000: 50000, 5000: 250000, 10000: 500000 };
    if (![1000, 5000, 10000].includes(tier)) return res.status(400).json({ success: false, message: "Invalid tier" });

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('depositTier')
      .eq('id', req.user.id)
      .single();
    if (fetchError || !user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.depositTier) return res.status(400).json({ success: false, message: "Tier already selected" });

    const updates = {
      depositTier: tier,
      demoBonus: bonuses[tier],
      demoBalance: bonuses[tier]
    };
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id);
    if (error) throw error;

    res.json({ success: true, message: "Tier selected", demoBonus: bonuses[tier], currentBalance: bonuses[tier] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/deposit/request", authMiddleware, async (req, res) => {
  try {
    const { amount, paymentProof } = req.body;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    const deposit = {
      id: Date.now().toString(),
      userId: req.user.id,
      username: user.username,
      amount: parseFloat(amount),
      paymentProof: paymentProof || "",
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      adminNotes: ""
    };

    const { error } = await supabase.from('deposits').insert(deposit);
    if (error) throw error;

    // ✅ Notify admin
    await addNotification(req.user.id, 'deposit', parseFloat(amount));

    res.json({
      success: true,
      message: "Deposit request submitted. Admin will review.",
      requestId: deposit.id,
      status: 'pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/user/deposit-history", authMiddleware, async (req, res) => {
  try {
    const { data: deposits, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('userId', req.user.id)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ success: true, deposits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== WITHDRAWAL ROUTES ==========
app.get("/withdrawal/requirements", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('depositTier, totalStakedReal, totalWonReal, withdrawalUnlocked')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });

    const tier = user.depositTier || 1000;
    const requirements = {
      1000: { stakeTarget: 15000, winTarget: 30000 },
      5000: { stakeTarget: 30000, winTarget: 50000 },
      10000: { stakeTarget: 75000, winTarget: 100000 }
    };
    const reqs = requirements[tier] || requirements[1000];
    const staked = user.totalStakedReal || 0;
    const won = user.totalWonReal || 0;
    const stakeProgress = Math.min((staked / reqs.stakeTarget) * 100, 100);
    const winProgress = Math.min((won / reqs.winTarget) * 100, 100);
    const bothMet = staked >= reqs.stakeTarget && won >= reqs.winTarget;

    res.json({
      success: true,
      tier,
      requirements: reqs,
      progress: {
        staked, stakeTarget: reqs.stakeTarget, stakeProgress: Math.floor(stakeProgress),
        won, winTarget: reqs.winTarget, winProgress: Math.floor(winProgress),
        bothRequirementsMet: bothMet
      },
      adminUnlocked: user.withdrawalUnlocked || false,
      canRequestWithdrawal: bothMet && (user.withdrawalUnlocked || false)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/withdrawal/request", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.bankName || !user.accountNumber) {
      return res.status(400).json({ success: false, message: "Save bank details first" });
    }
    if (!user.withdrawalUnlocked) {
      return res.status(400).json({ success: false, message: "Withdrawal not unlocked by admin" });
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });
    if (amountNum < 1000) return res.status(400).json({ success: false, message: "Minimum withdrawal is ₦1,000" });
    if (amountNum > user.realBalance) {
      return res.status(400).json({ success: false, message: `Amount exceeds your balance of ₦${user.realBalance.toLocaleString()}` });
    }

    const { data: pending } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('userId', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (pending) {
      return res.status(400).json({ success: false, message: "You already have a pending withdrawal." });
    }

    const withdrawal = {
      id: Date.now().toString(),
      userId: user.id,
      amount: amountNum,
      status: 'pending',
      bankName: user.bankName,
      accountName: user.accountName,
      accountNumber: user.accountNumber,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('withdrawals').insert(withdrawal);
    if (error) throw error;

    // ✅ Notify admin
    await addNotification(req.user.id, 'withdrawal', amountNum);

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      requestId: withdrawal.id,
      status: 'pending',
      currentBalance: user.realBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/user/withdrawal-history", authMiddleware, async (req, res) => {
  try {
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('userId', req.user.id)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ success: true, withdrawals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== REFERRAL ROUTES ==========
app.get("/user/referral-info", authMiddleware, async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_code, total_referral_deposits, referral_earnings')
      .eq('id', req.user.id)
      .single();
    if (userError) throw userError;

    const { data: referrals, error: refError } = await supabase
      .from('referrals')
      .select('referred_username, referred_at, total_deposited, commission_earned')
      .eq('referrer_id', req.user.id)
      .order('referred_at', { ascending: false });
    if (refError) throw refError;

    res.json({
      success: true,
      referralCode: user.referral_code,
      totalReferred: referrals.length,
      totalDepositsFromReferrals: user.total_referral_deposits || 0,
      totalEarnings: user.referral_earnings || 0,
      referrals: referrals.map(r => ({
        username: r.referred_username,
        date: r.referred_at,
        deposited: r.total_deposited,
        earned: r.commission_earned
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== ADMIN ROUTES ==========
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    if (error || !user) return res.status(400).json({ success: false, message: "Invalid credentials" });
    if (!user.isAdmin) return res.status(403).json({ success: false, message: "Not an admin account" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: true, role: user.adminRole },
      process.env.JWT_SECRET || "dev_secret_123",
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: { id: user.id, username: user.username, role: user.adminRole }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/users", adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, phone, depositTier, realBalance, demoBalance, totalStakedReal, totalWonReal, withdrawalUnlocked, bankName, lastGamePlayed, createdAt, isAdmin, referral_code, gamesPlayed, totalWins, is_promoter');
    if (error) throw error;

    const formatted = users.map(user => ({
      ...user,
      bankDetails: user.bankName ? 'Saved' : 'Not saved'
    }));
    res.json({ success: true, count: formatted.length, users: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/eligible-users", adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, depositTier, totalStakedReal, totalWonReal, withdrawalUnlocked');
    if (error) throw error;

    const targets = {
      1000: { stakeTarget: 15000, winTarget: 30000 },
      5000: { stakeTarget: 30000, winTarget: 50000 },
      10000: { stakeTarget: 75000, winTarget: 100000 }
    };

    const eligible = users
      .filter(user => {
        const tier = user.depositTier || 1000;
        const target = targets[tier];
        const staked = user.totalStakedReal || 0;
        const won = user.totalWonReal || 0;
        return staked >= target.stakeTarget && won >= target.winTarget;
      })
      .map(user => ({
        id: user.id,
        username: user.username,
        tier: user.depositTier || 1000,
        staked: user.totalStakedReal || 0,
        stakeTarget: targets[user.depositTier || 1000].stakeTarget,
        won: user.totalWonReal || 0,
        winTarget: targets[user.depositTier || 1000].winTarget,
        withdrawalUnlocked: user.withdrawalUnlocked || false
      }));

    res.json({ success: true, count: eligible.length, users: eligible });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/unlock-withdrawal/:userId", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabaseAdmin
      .from('users')
      .update({ withdrawalUnlocked: true })
      .eq('id', userId);
    if (error) throw error;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      message: `Withdrawal unlocked for ${user.username}`,
      user: { id: userId, username: user.username, withdrawalUnlocked: true }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/lock-withdrawal/:userId", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabaseAdmin
      .from('users')
      .update({ withdrawalUnlocked: false })
      .eq('id', userId);
    if (error) throw error;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      message: `Withdrawal locked for ${user.username}`,
      user: { id: userId, username: user.username, withdrawalUnlocked: false }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/withdrawal-requests", adminMiddleware, async (req, res) => {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*, users(username, realBalance)')
      .order('createdAt', { ascending: false });
    if (error) throw error;

    const fullRequests = requests.map(req => ({
      requestId: req.id,
      userId: req.userId,
      username: req.users?.username || 'Unknown',
      amount: req.amount,
      bankName: req.bankName || '',
      accountName: req.accountName || '',
      accountNumber: req.accountNumber || '',
      status: req.status,
      requestedAt: req.createdAt,
      approvedAt: req.approvedAt,
      paidAt: req.paidAt,
      adminNotes: req.notes || '',
      userBalance: req.users?.realBalance || 0
    }));

    res.json({ success: true, count: fullRequests.length, requests: fullRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/approve-withdrawal/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('*, users(realBalance, username)')
      .eq('id', requestId)
      .single();
    if (fetchError || !withdrawal) return res.status(404).json({ success: false, message: "Request not found" });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal already ${withdrawal.status}` });
    }

    const userBalance = withdrawal.users?.realBalance || 0;
    if (userBalance < withdrawal.amount) {
      return res.status(400).json({ success: false, message: "User has insufficient balance" });
    }

    const { error: deductError } = await supabaseAdmin
      .from('users')
      .update({ realBalance: userBalance - withdrawal.amount })
      .eq('id', withdrawal.userId);
    if (deductError) throw deductError;

    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        notes: notes || "Approved by admin"
      })
      .eq('id', requestId);
    if (updateError) throw updateError;

    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .select('realBalance')
      .eq('id', withdrawal.userId)
      .single();

    res.json({
      success: true,
      message: `Withdrawal approved for ${withdrawal.users?.username}. ₦${withdrawal.amount} deducted.`,
      request: {
        id: requestId,
        status: 'approved',
        amount: withdrawal.amount,
        userBalance: updatedUser.realBalance
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/reject-withdrawal/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'rejected', notes: notes || "Rejected by admin" })
      .eq('id', requestId);
    if (error) throw error;
    res.json({ success: true, message: "Withdrawal rejected", request: { id: requestId, status: 'rejected' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/mark-paid/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentProof } = req.body;

    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('status')
      .eq('id', requestId)
      .single();
    if (fetchError || !withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found" });
    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ success: false, message: "Withdrawal must be approved first" });
    }

    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentProof: paymentProof || ""
      })
      .eq('id', requestId);
    if (error) throw error;

    res.json({ success: true, message: "Withdrawal marked as paid" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/deposit-requests", adminMiddleware, async (req, res) => {
  try {
    const { data: deposits, error } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    res.json({ success: true, count: deposits.length, requests: deposits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== APPROVE DEPOSIT ==========
app.post("/api/admin/approve-deposit/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const { data: deposit, error: updateError } = await supabaseAdmin
      .from('deposits')
      .update({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        adminNotes: notes || "Approved by admin"
      })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select();

    if (updateError) throw updateError;
    if (!deposit || deposit.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Deposit request not found or already processed" 
      });
    }

    const approvedDeposit = deposit[0];

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', approvedDeposit.userId)
      .single();
    if (userError) throw userError;

    const newBalance = (user.realBalance || 0) + approvedDeposit.amount;
    const { error: balanceError } = await supabaseAdmin
      .from('users')
      .update({ realBalance: newBalance })
      .eq('id', approvedDeposit.userId);
    if (balanceError) throw balanceError;

    if (user.referred_by) {
      try {
        const commissionRate = 0.05;
        const commission = approvedDeposit.amount * commissionRate;

        const { error: rpc1Error } = await supabaseAdmin.rpc('increment_referral_stats', {
          referrer_id: user.referred_by,
          deposit_amount: approvedDeposit.amount,
          commission_amount: commission
        });

        if (rpc1Error) {
          console.warn('⚠️ increment_referral_stats RPC failed, using direct update:', rpc1Error.message);
          await supabaseAdmin
            .from('users')
            .update({
              total_referral_deposits: supabaseAdmin.raw('COALESCE(total_referral_deposits,0) + ?', [approvedDeposit.amount]),
              referral_earnings: supabaseAdmin.raw('COALESCE(referral_earnings,0) + ?', [commission])
            })
            .eq('id', user.referred_by);
        }

        const { error: refUpdateError } = await supabaseAdmin
          .from('referrals')
          .update({
            total_deposited: supabaseAdmin.raw('COALESCE(total_deposited,0) + ?', [approvedDeposit.amount]),
            commission_earned: supabaseAdmin.raw('COALESCE(commission_earned,0) + ?', [commission])
          })
          .eq('referred_id', approvedDeposit.userId);
        if (refUpdateError) console.error('❌ referrals update error:', refUpdateError);

        const { error: rpc2Error } = await supabaseAdmin.rpc('add_to_user_balance', {
          user_id: user.referred_by,
          amount: commission
        });

        if (rpc2Error) {
          console.warn('⚠️ add_to_user_balance RPC failed, using direct update:', rpc2Error.message);
          await supabaseAdmin
            .from('users')
            .update({ realBalance: supabaseAdmin.raw('COALESCE(realBalance,0) + ?', [commission]) })
            .eq('id', user.referred_by);
        }
      } catch (refErr) {
        console.error('❌ Referral processing error (non‑critical):', refErr);
      }
    }

    res.json({
      success: true,
      message: `Deposit approved. ₦${approvedDeposit.amount} added to ${user.username}.`,
      deposit: {
        id: requestId,
        status: 'approved',
        amount: approvedDeposit.amount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/reject-deposit/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const { error } = await supabaseAdmin
      .from('deposits')
      .update({ status: 'rejected', adminNotes: notes || "Rejected by admin" })
      .eq('id', requestId);
    if (error) throw error;
    res.json({ success: true, message: "Deposit rejected", deposit: { id: requestId, status: 'rejected' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/referral-stats", adminMiddleware, async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username, referral_code, total_referral_deposits, referral_earnings, "createdAt"')
      .not('referral_code', 'is', null);
    
    if (usersError) {
      console.error('❌ Supabase users error:', usersError);
      return res.status(500).json({ success: false, message: "Database error: " + usersError.message });
    }

    const stats = await Promise.all(users.map(async (user) => {
      const { count, error: countError } = await supabaseAdmin
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);
      
      if (countError) {
        console.error(`❌ Count error for user ${user.id}:`, countError);
        return { ...user, referredCount: 0 };
      }
      
      return {
        ...user,
        referredCount: count
      };
    }));

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Referral stats catch block:', error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

app.delete("/api/admin/users/:userId", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.admin.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own admin account" });
    }
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/pending-count", adminMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) throw error;
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MINESWEEPER ENDPOINTS ==========
app.post("/game/minesweeper/start", authMiddleware, async (req, res) => {
    try {
        const { difficulty, entryFee } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < entryFee) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - entryFee;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/minesweeper/win", authMiddleware, async (req, res) => {
    try {
        const { prize, difficulty } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        // Record game history
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'minesweeper',
            difficulty: difficulty,
            prize: prize,
            result: 'win',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== WHEEL OF FORTUNE ENDPOINTS ==========
app.post("/game/wheel/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/wheel/win", authMiddleware, async (req, res) => {
    try {
        const { prize, bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        // Record game history
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'wheel',
            bet: bet,
            prize: prize,
            result: prize > 0 ? 'win' : 'loss',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== BLACKJACK ENDPOINTS ==========
app.post("/game/blackjack/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/blackjack/double", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/blackjack/win", authMiddleware, async (req, res) => {
    try {
        const { prize, bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        // Record game history
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'blackjack',
            bet: bet,
            prize: prize,
            result: 'win',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/blackjack/push", authMiddleware, async (req, res) => {
    try {
        const { bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + bet;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DICE GAME ENDPOINTS ==========
app.post("/game/dice/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/dice/win", authMiddleware, async (req, res) => {
    try {
        const { prize, bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'dice',
            bet: bet,
            prize: prize,
            result: 'win',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== SLOT MACHINE ENDPOINTS ==========
app.post("/game/slots/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/slots/win", authMiddleware, async (req, res) => {
    try {
        const { prize, bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'slots',
            bet: bet,
            prize: prize,
            result: 'win',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== BALLOON POP ENDPOINTS ==========
app.post("/game/balloon/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/balloon/win", authMiddleware, async (req, res) => {
    try {
        const { prize, bet } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        const newBalance = user.realBalance + prize;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        const gameRecord = {
            id: Date.now().toString(),
            userId: req.user.id,
            gameType: 'balloon',
            bet: bet,
            prize: prize,
            result: prize > 0 ? 'win' : 'loss',
            createdAt: new Date().toISOString()
        };
        await supabase.from('game_history').insert(gameRecord);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Balloon game win endpoint
app.post("/game/balloon-win", authMiddleware, async (req, res) => {
    try {
        const { winAmount, bet } = req.body;
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
            
        if (userError || !user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const newBalance = user.realBalance + winAmount;
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
            
        if (updateError) throw updateError;
        
        res.json({ success: true, newBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ========== CRASH GAME ROUTES ==========
app.post("/game/crash/bet", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        if (user.realBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        
        const newBalance = user.realBalance - amount;
        await supabase
            .from('users')
            .update({ realBalance: newBalance })
            .eq('id', req.user.id);
        
        res.json({ success: true, newBalance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/game/crash/result", authMiddleware, async (req, res) => {
    try {
        const { bet, multiplier, crashed } = req.body;
        const { data: user } = await supabase
            .from('users')
            .select('realBalance')
            .eq('id', req.user.id)
            .single();
        
        let newBalance = user.realBalance;
        let winAmount = 0;
        
        if (!crashed) {
            winAmount = bet * multiplier;
            newBalance = user.realBalance + winAmount;
            await supabase
                .from('users')
                .update({ realBalance: newBalance })
                .eq('id', req.user.id);
        }
        
        res.json({ success: true, newBalance, winAmount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Database: Supabase`);
});