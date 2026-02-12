const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
  }
}));

// ========== SUPABASE CLIENTS ==========
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    // Get user from DB and check isAdmin
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

// ========== GAME LOGIC ==========
class GameLogic {
  constructor() {
    this.sections = {
      'A': { minStake: 150, maxWin: 2250 },
      'B': { minStake: 300, maxWin: 7500 },
      'C': { minStake: 500, maxWin: 10000 },
      'D': { minStake: 1000, maxWin: 15000 }
    };
    this.probabilities = {
      demo: {
        'A': { winChance: 0.4, amounts: [150, 300, 450, 600, 750] },
        'B': { winChance: 0.4, amounts: [300, 600, 900, 1200, 1500] },
        'C': { winChance: 0.4, amounts: [500, 1000, 1500, 2000, 2500] },
        'D': { winChance: 0.4, amounts: [1000, 2000, 3000, 4000, 5000] }
      },
      real: {
        'A': { winChance: 0.0001, amounts: [50, 100, 150, 300, 450, 600] },
        'B': { winChance: 0.05, amounts: [100, 200, 300, 500, 750] },
        'C': { winChance: 0.05, amounts: [150, 300, 500, 750, 1000] },
        'D': { winChance: 0.05, amounts: [300, 500, 750, 1000, 1250] }
      }
    };
  }

  getSectionFromStake(stake) {
    for (const [section, data] of Object.entries(this.sections)) {
      if (stake === data.minStake) return section;
    }
    return 'A';
  }

  generateGrid(section, mode = 'demo') {
    const sectionProb = this.probabilities[mode][section];
    const grid = [];
    for (let i = 0; i < 9; i++) {
      grid.push(sectionProb.amounts[Math.floor(Math.random() * sectionProb.amounts.length)]);
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

  determineWin(section, mode) {
    return Math.random() < this.probabilities[mode][section].winChance;
  }

  applyProbabilityToGrid(grid, section, mode) {
    if (this.determineWin(section, mode)) {
      const amounts = this.probabilities[mode][section].amounts;
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

// ========== INIT ADMIN ACCOUNTS ==========
async function initializeAdminAccounts() {
  const adminAccounts = [
    { username: "admin", password: "admin123", name: "Main Admin", phone: "0000000000" },
    { username: "manager", password: "manager123", name: "Manager", phone: "0000000001" },
    { username: "support", password: "support123", name: "Support", phone: "0000000002" }
  ];

  for (const acc of adminAccounts) {
    // Check if admin already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', acc.username)
      .maybeSingle();

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(acc.password, salt);
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
        isAdmin: true,
        adminRole: acc.name,
        createdAt: new Date().toISOString()
      };
      await supabaseAdmin.from('users').insert(newAdmin);
      console.log(`✅ Created admin: ${acc.username}`);
    }
  }
}

// Call after server starts
setTimeout(() => initializeAdminAccounts(), 1000);

// ========== ROUTES ==========
app.get("/", (req, res) => {
  res.json({ success: true, message: "Scratch & Win API", database: "Supabase" });
});

// REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const { phone, username, password, referralCode } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`phone.eq.${phone},username.eq.${username}`)
      .maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: "User exists" });

    // Validate referral code if provided
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique referral code for new user
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
      createdAt: new Date().toISOString(),
      referral_code: newReferralCode,
      referred_by: referrer ? referrer.id : null,
      referral_earnings: 0,
      total_referral_deposits: 0
    };

    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;

    // If referred, create entry in referrals table
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

// LOGIN
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
    res.json({ success: true, message: "Logged in", token, user: { id: user.id, username, balance: user.realBalance, demoBalance: user.demoBalance } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET USER INFO
app.get("/user/me", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, realBalance, demoBalance, depositTier, currentBalanceMode, totalStakedReal, totalStakedDemo')
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
        totalStakedDemo: user.totalStakedDemo || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CHECK TIER
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

// SELECT TIER
app.post("/deposit/select-tier", authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body;
    const bonuses = { 1000: 50000, 5000: 250000, 10000: 500000 };
    if (![1000, 5000, 10000].includes(tier)) return res.status(400).json({ success: false, message: "Invalid tier" });

    // Check if tier already selected
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

// SWITCH BALANCE MODE
app.post("/user/switch-balance-mode", authMiddleware, async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['demo', 'real'].includes(mode)) return res.status(400).json({ success: false, message: "Invalid mode" });

    const { error } = await supabase
      .from('users')
      .update({ currentBalanceMode: mode })
      .eq('id', req.user.id);
    if (error) throw error;

    // Get updated balance
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

// PLAY GAME
app.post("/game/play", authMiddleware, async (req, res) => {
  try {
    const { stake, mode = 'demo' } = req.body;
    if (![150, 300, 500, 1000].includes(stake)) return res.status(400).json({ success: false, message: "Invalid stake" });

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    const balance = mode === 'demo' ? user.demoBalance : user.realBalance;
    if (balance < stake) return res.status(400).json({ success: false, message: `Insufficient ${mode} balance` });

    const section = gameLogic.getSectionFromStake(stake);
    let grid = gameLogic.generateGrid(section, mode);
    grid = gameLogic.applyProbabilityToGrid(grid, section, mode);
    const result = gameLogic.checkForWin(grid);

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
    updates.gamesPlayed = (user.gamesPlayed || 0) + 1;
    updates.lastGamePlayed = new Date().toISOString();

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    if (updateError) throw updateError;

    // Get updated balances
    const { data: updatedUser } = await supabase
      .from('users')
      .select('demoBalance, realBalance')
      .eq('id', user.id)
      .single();

    gameRecord.newBalance = mode === 'demo' ? updatedUser.demoBalance : updatedUser.realBalance;
    // Save game
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

// GAME HISTORY
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

// SAVE BANK DETAILS
app.post("/user/save-bank-details", authMiddleware, async (req, res) => {
  try {
    const { bankName, accountName, accountNumber } = req.body;
    if (!bankName || !accountName || !accountNumber) return res.status(400).json({ success: false, message: "All details required" });

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

// WITHDRAWAL REQUIREMENTS
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
      1000: { stakeTarget: 5000, winTarget: 3000 },
      5000: { stakeTarget: 20000, winTarget: 15000 },
      10000: { stakeTarget: 40000, winTarget: 30000 }
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

// USER WITHDRAWAL REQUEST
app.post("/withdrawal/request", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    // Validation
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

    // Check pending withdrawals
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

// USER WITHDRAWAL HISTORY
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

// USER DEPOSIT REQUEST
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

// USER DEPOSIT HISTORY
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

// ========== ADMIN ROUTES (use supabaseAdmin) ==========
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

// GET ALL USERS (admin)
app.get("/api/admin/users", adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, phone, depositTier, realBalance, demoBalance, totalStakedReal, totalWonReal, withdrawalUnlocked, bankName, lastGamePlayed, createdAt');
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

// ELIGIBLE USERS
app.get("/api/admin/eligible-users", adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, depositTier, totalStakedReal, totalWonReal, withdrawalUnlocked');
    if (error) throw error;

    const targets = {
      1000: { stakeTarget: 5000, winTarget: 3000 },
      5000: { stakeTarget: 20000, winTarget: 15000 },
      10000: { stakeTarget: 40000, winTarget: 30000 }
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

// UNLOCK WITHDRAWAL
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

// LOCK WITHDRAWAL
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

// GET WITHDRAWAL REQUESTS
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

// APPROVE WITHDRAWAL
app.post("/api/admin/approve-withdrawal/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    // Get withdrawal with user
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

    // Deduct balance
    const { error: deductError } = await supabaseAdmin
      .from('users')
      .update({ realBalance: userBalance - withdrawal.amount })
      .eq('id', withdrawal.userId);
    if (deductError) throw deductError;

    // Update withdrawal
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        notes: notes || "Approved by admin"
      })
      .eq('id', requestId);
    if (updateError) throw updateError;

    // Get updated user balance
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

// REJECT WITHDRAWAL
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

// MARK PAID
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

// DEPOSIT REQUESTS
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

// APPROVE DEPOSIT (with referral commission)
app.post("/api/admin/approve-deposit/:requestId", adminMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    // Get deposit request
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('id', requestId)
      .single();
    if (fetchError || !deposit) return res.status(404).json({ success: false, message: "Deposit not found" });

    // Get user to update balance and check if referred
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', deposit.userId)
      .single();
    if (userError) throw userError;

    // Update user's real balance
    const newBalance = (user.realBalance || 0) + deposit.amount;
    await supabaseAdmin
      .from('users')
      .update({ realBalance: newBalance })
      .eq('id', deposit.userId);

    // ===== REFERRAL BONUS =====
    if (user.referred_by) {
      const commissionRate = 0.05; // 5% commission
      const commission = deposit.amount * commissionRate;

      // Update referrer's total_referral_deposits and earnings
      await supabaseAdmin.rpc('increment_referral_stats', {
        referrer_id: user.referred_by,
        deposit_amount: deposit.amount,
        commission_amount: commission
      });

      // Also update the specific referral record
      await supabaseAdmin
        .from('referrals')
        .update({
          total_deposited: supabaseAdmin.raw('total_deposited + ?', [deposit.amount]),
          commission_earned: supabaseAdmin.raw('commission_earned + ?', [commission])
        })
        .eq('referred_id', deposit.userId);

      // Add commission to referrer's real balance
      await supabaseAdmin.rpc('add_to_user_balance', {
        user_id: user.referred_by,
        amount: commission
      });
    }

    // Update deposit status
    await supabaseAdmin
      .from('deposits')
      .update({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        adminNotes: notes || "Approved by admin"
      })
      .eq('id', requestId);

    res.json({
      success: true,
      message: `Deposit approved. ₦${deposit.amount} added.`,
      deposit: { id: requestId, status: 'approved', amount: deposit.amount }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// REJECT DEPOSIT
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

// ========== REFERRAL ENDPOINTS ==========

// Get user's own referral code and stats
app.get("/user/referral-info", authMiddleware, async (req, res) => {
  try {
    // Get user's referral code and total referral deposits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_code, total_referral_deposits, referral_earnings')
      .eq('id', req.user.id)
      .single();
    if (userError) throw userError;

    // Get count of referred users and list them
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

// Admin: get all referral stats
app.get("/api/admin/referral-stats", adminMiddleware, async (req, res) => {
  try {
    // Get all users with referral codes and counts
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username, referral_code, total_referral_deposits, referral_earnings, created_at')
      .not('referral_code', 'is', null);
    if (usersError) throw usersError;

    // For each user, get count of referrals and total deposited
    const stats = await Promise.all(users.map(async (user) => {
      const { count, error: countError } = await supabaseAdmin
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);
      if (countError) throw countError;

      return {
        ...user,
        referredCount: count
      };
    }));

    res.json({ success: true, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: delete user account (and all related data)
app.delete("/api/admin/users/:userId", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.admin.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own admin account" });
    }

    // Delete user – foreign key constraints will cascade to games, withdrawals, deposits, referrals
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

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Database: Supabase`);
});