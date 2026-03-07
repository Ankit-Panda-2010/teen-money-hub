// Teen Money Hub JavaScript

// Dark mode functionality
function toggleDarkMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'true');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'false');
    }
}

// Check for saved dark mode preference
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    const themeIcon = document.getElementById('theme-icon');
    
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// Data storage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 200; // Default teen allowance

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initializeTabs();
    updateDate();
    loadDashboard();
    loadExpenses();
    loadBudgets();
    loadGoals();
    initializeCharts();
    
    // Initialize blog functionality
    initializeBlogSearch();
});

// Tab navigation
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Update buttons
            tabBtns.forEach(b => {
                b.classList.remove('border-blue-600', 'text-blue-600');
                b.classList.add('border-transparent', 'text-gray-700');
            });
            btn.classList.remove('border-transparent', 'text-gray-700');
            btn.classList.add('border-blue-600', 'text-blue-600');
            
            // Update content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetElement = document.getElementById(targetTab);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

// Update current date
function updateDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// Dashboard functions
function loadDashboard() {
    const totalBalance = calculateTotalBalance();
    const monthlyExpenses = calculateMonthlyExpenses();
    const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);

    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('savingsRate').textContent = savingsRate + '%';
}

function calculateTotalBalance() {
    return monthlyIncome - calculateMonthlyExpenses();
}

function calculateMonthlyExpenses() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + expense.amount, 0);
}

function calculateSavingsRate(income, expenses) {
    if (income === 0) return 0;
    return Math.round(((income - expenses) / income) * 100);
}

// Expense functions
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const expense = {
        id: Date.now(),
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: document.getElementById('expenseCategory').value,
        date: new Date().toISOString()
    };
    
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    this.reset();
    loadExpenses();
    loadDashboard();
    updateCharts();
});

function loadExpenses() {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';
    
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.slice(-10).reverse().forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-2 px-4">${new Date(expense.date).toLocaleDateString()}</td>
            <td class="py-2 px-4">${expense.description}</td>
            <td class="py-2 px-4">
                <span class="px-2 py-1 text-xs rounded-full bg-${getCategoryColor(expense.category)}-100 text-${getCategoryColor(expense.category)}-800">
                    ${expense.category}
                </span>
            </td>
            <td class="py-2 px-4 text-right">${formatCurrency(expense.amount)}</td>
            <td class="py-2 px-4 text-center">
                <button onclick="deleteExpense(${expense.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        expensesList.appendChild(row);
    });
}

function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    loadExpenses();
    loadDashboard();
    updateCharts();
}

function getCategoryColor(category) {
    const colors = {
        food: 'yellow',
        transport: 'blue',
        entertainment: 'purple',
        shopping: 'pink',
        friends: 'green',
        other: 'gray'
    };
    return colors[category] || 'gray';
}

// Budget functions
document.getElementById('budgetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    budgets[category] = amount;
    localStorage.setItem('budgets', JSON.stringify(budgets));
    
    this.reset();
    loadBudgets();
    loadDashboard();
});

function loadBudgets() {
    const budgetList = document.getElementById('budgetList');
    budgetList.innerHTML = '';
    
    Object.entries(budgets).forEach(([category, budgetAmount]) => {
        const spent = calculateCategorySpending(category);
        const percentage = (spent / budgetAmount) * 100;
        const isOverBudget = spent > budgetAmount;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'border rounded-lg p-4';
        budgetItem.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold capitalize">${category}</h4>
                <span class="text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}">
                    ${formatCurrency(spent)} / ${formatCurrency(budgetAmount)}
                </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="progress-bar bg-${isOverBudget ? 'red' : 'green'}-500 h-2 rounded-full" 
                     style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">${Math.round(percentage)}% used</div>
        `;
        budgetList.appendChild(budgetItem);
    });
}

function calculateCategorySpending(category) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expense.category === category && 
                   expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + expense.amount, 0);
}

// Goals functions
document.getElementById('goalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const goal = {
        id: Date.now(),
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        current: parseFloat(document.getElementById('goalCurrent').value)
    };
    
    goals.push(goal);
    localStorage.setItem('goals', JSON.stringify(goals));
    
    this.reset();
    loadGoals();
});

function loadGoals() {
    const goalsList = document.getElementById('goalsList');
    goalsList.innerHTML = '';
    
    goals.forEach(goal => {
        const percentage = (goal.current / goal.target) * 100;
        const isCompleted = goal.current >= goal.target;
        
        const goalItem = document.createElement('div');
        goalItem.className = 'border rounded-lg p-4';
        goalItem.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">${goal.name}</h4>
                <button onclick="deleteGoal(${goal.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>${formatCurrency(goal.current)}</span>
                <span>${formatCurrency(goal.target)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="progress-bar bg-${isCompleted ? 'green' : 'blue'}-500 h-2 rounded-full" 
                     style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">${Math.round(percentage)}% complete</div>
            <div class="mt-2">
                <input type="number" placeholder="Add amount" step="0.01" 
                       class="px-2 py-1 border rounded text-sm mr-2" id="goalAmount-${goal.id}">
                <button onclick="updateGoalProgress(${goal.id})" 
                        class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Add Progress
                </button>
            </div>
        `;
        goalsList.appendChild(goalItem);
    });
}

function updateGoalProgress(goalId) {
    const amountInput = document.getElementById(`goalAmount-${goalId}`);
    const amount = parseFloat(amountInput.value);
    
    if (amount > 0) {
        const goal = goals.find(g => g.id === goalId);
        goal.current += amount;
        localStorage.setItem('goals', JSON.stringify(goals));
        
        amountInput.value = '';
        loadGoals();
        loadDashboard();
    }
}

function deleteGoal(id) {
    goals = goals.filter(goal => goal.id !== id);
    localStorage.setItem('goals', JSON.stringify(goals));
    loadGoals();
}

// Chart functions
let expenseChart, trendChart;

function initializeCharts() {
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    
    expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FCD34D', '#60A5FA', '#A78BFA', '#34D399', '#F87171', '#9CA3AF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: [],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    updateCharts();
}

function updateCharts() {
    // Update expense breakdown chart
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    expenseChart.data.labels = Object.keys(categoryTotals);
    expenseChart.data.datasets[0].data = Object.values(categoryTotals);
    expenseChart.update();
    
    // Update trend chart (last 6 months)
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthName);
        
        const monthExpenses = expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === date.getMonth() && 
                       expenseDate.getFullYear() === date.getFullYear();
            })
            .reduce((total, expense) => total + expense.amount, 0);
        
        incomeData.push(monthlyIncome);
        expenseData.push(monthExpenses);
    }
    
    trendChart.data.labels = months;
    trendChart.data.datasets[0].data = incomeData;
    trendChart.data.datasets[1].data = expenseData;
    trendChart.update();
}

// Blog Articles Data
const blogArticles = {
    'investing-101': {
        title: 'Investing 101 for Teens',
        category: 'investing',
        readTime: '8 min read',
        content: `
            <h2>Think You're Too Young to Invest? Think Again!</h2>
            <p>Ever heard adults talking about stocks and investments and thought it was something only "grown-ups" do? Wrong! You can start investing right now, even as a teenager, and the best part is - you don't need thousands of dollars to begin.</p>
            
            <h3>What Even IS Investing?</h3>
            <p>Investing is basically making your money work for you. Instead of just letting your money sit in a piggy bank (where it actually loses value over time because of inflation), you put it into things that can grow in value.</p>
            
            <h3>Start Small - Really Small</h3>
            <p>You don't need $1,000 to start investing. Many apps let you start with just $5-20:</p>
            <ul>
                <li><strong>Acorns</strong> - Rounds up your purchases and invests the spare change</li>
                <li><strong>Stash</strong> - Lets you buy pieces of stocks for as little as $5</li>
                <li><strong>Fidelity Youth Account</strong> - Designed specifically for teens (with parent approval)</li>
            </ul>
            
            <h3>The Magic of Compound Interest</h3>
            <p>Here's why starting young is your superpower: If you invest $1,000 at age 15 and earn 8% per year, by age 65 you'll have over $46,000. If you wait until age 25 to start, you'd only have about $21,000. That's the power of compound interest!</p>
            
            <h3>What Should You Invest In?</h3>
            <p><strong>ETFs (Exchange Traded Funds)</strong> are perfect for beginners. Instead of buying one company's stock, you're buying a little piece of hundreds of companies. It's like buying a variety pack instead of just one flavor.</p>
            
            <p>Popular ETFs for teens:</p>
            <ul>
                <li>VTI - Total stock market (owns a piece of almost every US company)</li>
                <li>QQQ - Tech companies (Apple, Google, Facebook, etc.)</li>
                <li>VOO - Top 500 biggest US companies</li>
            </ul>
            
            <h3>Risks vs. Rewards</h3>
            <p>Investing isn't guaranteed - you can lose money too. That's why you should:</p>
            <ul>
                <li>Only invest money you won't need for at least 5 years</li>
                <li>Don't panic if the market goes down (it always recovers)</li>
                <li>Keep investing regularly (dollar-cost averaging)</li>
            </ul>
            
            <h3>Getting Started Checklist</h3>
            <ol>
                <li>Talk to your parents about opening a custodial account</li>
                <li>Choose an investment app that allows teens</li>
                <li>Start with $20-50 per month</li>
                <li>Pick a simple ETF to begin with</li>
                <li>Set up automatic investments if possible</li>
            </ol>
            
            <h3>The Bottom Line</h3>
            <p>Investing as a teen isn't about getting rich quick. It's about building good habits and letting time be your best friend. Even small amounts invested now can grow into serious money by the time you're ready for college, your first car, or moving out.</p>
            
            <p><strong>Remember:</strong> The best time to start investing was yesterday. The second best time is today!</p>
        `
    },
    'saving-hacks': {
        title: '15 Saving Hacks for Teens',
        category: 'saving',
        readTime: '6 min read',
        content: `
            <h2>Save Money Without Feeling Like You're Missing Out</h2>
            <p>Saving money as a teen can feel impossible when your friends are always doing fun stuff that costs money. But what if you could save money AND still have a social life? These hacks actually work!</p>
            
            <h3>🎯 The 50/30/20 Rule (Teen Version)</h3>
            <p>Split your money like this:</p>
            <ul>
                <li><strong>50%</strong> - Needs (lunch money, bus fare, phone bill)</li>
                <li><strong>30%</strong> - Wants (movies, games, clothes)</li>
                <li><strong>20%</strong> - Savings (for bigger goals)</li>
            </ul>
            
            <h3>💡 15 Teen-Approved Saving Hacks</h3>
            
            <h4>1. The 24-Hour Rule</h4>
            <p>See something you want online? Put it in your cart but don't buy for 24 hours. After a day, you'll know if you really want it or if it was just impulse.</p>
            
            <h4>2. Pack Lunch Twice a Week</h4>
            <p>School lunch costs about $3-5 per day. Packing lunch just twice a week saves you $6-10 weekly = $24-40 per month!</p>
            
            <h4>3. Student Discount Everything</h4>
            <p>Always ask "Do you have a student discount?" Movie theaters, restaurants, clothing stores, even Apple gives student discounts.</p>
            
            <h4>4. Round-Up Savings</h4>
            <p>Spend $4.50 on something? Round up and put $0.50 in savings. Apps like Acorns do this automatically.</p>
            
            <h4>5. The Envelope Method</h4>
            <p>Put cash in envelopes for different categories (food, fun, savings). When the envelope's empty, you're done spending in that category.</p>
            
            <h4>6. Sell Stuff You Don't Use</h4>
            <p>Old video games, clothes you've outgrown, that skateboard gathering dust - sell it on Depop, Poshmark, or Facebook Marketplace.</p>
            
            <h4>7. Free Fun Challenge</h4>
            <p>Challenge your friends to find free activities: parks, hiking, home movie nights, game nights. You'd be surprised how much fun you can have for $0.</p>
            
            <h4>8. Cancel Unused Subscriptions</h4>
            <p>That streaming service you haven't watched in 3 months? Cancel it. Even $10/month adds up to $120/year.</p>
            
            <h4>9. Buy Secondhand First</h4>
            <p>Need new clothes or shoes? Check thrift stores, Depop, or Poshmark first. You can find brand-name stuff for way less.</p>
            
            <h4>10. DIY Gifts</h4>
            <p>Instead of buying expensive gifts for friends' birthdays, make something personal. A photo album, baked goods, or a handwritten card often means more.</p>
            
            <h4>11. Water Bottle Life</h4>
            <p>Stop buying bottled drinks. A reusable water bottle saves you $2-3 per day at school.</p>
            
            <h4>12. Split Costs with Friends</h4>
            <p>Going to the movies? Split popcorn. Getting pizza? split the cost. Don't be the one always paying for everything.</p>
            
            <h4>13. Wait for Sales</h4>
            <p>Want a new video game or pair of shoes? Wait for holiday sales, Black Friday, or back-to-school deals.</p>
            
            <h4>14. Learn to Cook Basic Stuff</h4>
            <p>Instead of ordering delivery or going out, learn to make 3-4 simple meals. It's way cheaper and impressive.</p>
            
            <h4>15. Set Up Automatic Savings</h4>
            <p>If you have a bank account, set up automatic transfers to savings. Even $5/week adds up to $260/year.</p>
            
            <h3>🔥 Pro Tips</h3>
            <ul>
                <li>Track your spending for one week - you'll be surprised where money goes</li>
                <li>Use apps like Mint or YNAB to see your money patterns</li>
                <li>Start a savings challenge with friends to stay motivated</li>
                <li>Remember: saving isn't about never having fun - it's about choosing what's worth it</li>
            </ul>
            
            <h3>💪 Making It Stick</h3>
            <p>Start with 2-3 of these hacks. Don't try to do all 15 at once or you'll get overwhelmed. Pick the ones that seem easiest and build from there.</p>
            
            <p>The goal isn't to never spend money - it's to spend intentionally on things that actually matter to you!</p>
        `
    },
    'teen-jobs': {
        title: '10 Jobs You Can Get as a Teen',
        category: 'earning',
        readTime: '7 min read',
        content: `
            <h2>Make Your Own Money (Without Ruining Your Grades)</h2>
            <p>Want your own spending money but stuck wondering how to earn it while juggling school, homework, and actually having a life? Here are 10 realistic jobs that work with a teen schedule.</p>
            
            <h3>🏪 Traditional Jobs (with set schedules)</h3>
            
            <h4>1. Retail Worker</h4>
            <p><strong>What you'll do:</strong> Help customers, stock shelves, work the cash register</p>
            <p><strong>Pay:</strong> $12-16/hour plus employee discounts</p>
            <p><strong>Best for:</strong> People who like talking to others and can work weekends</p>
            <p><strong>Where to look:</strong> Mall stores, grocery stores, big box retailers</p>
            
            <h4>2. Food Service</h4>
            <p><strong>What you'll do:</strong> Take orders, make food, clean up, work drive-thru</p>
            <p><strong>Pay:</strong> $11-15/hour plus tips (sometimes)</p>
            <p><strong>Best for:</strong> Fast-paced environments, flexible evening shifts</p>
            <p><strong>Where to look:</strong> Fast food chains, local restaurants, ice cream shops</p>
            
            <h4>3. Movie Theater</h4>
            <p><strong>What you'll do:</strong> Sell tickets, serve concessions, clean theaters</p>
            <p><strong>Pay:</strong> $12-14/hour plus free movies!</p>
            <p><strong>Best for:</strong> Weekend and evening work, social environment</p>
            
            <h3>💻 Side Hustles (work when you want)</h3>
            
            <h4>4. Tutoring</h4>
            <p><strong>What you'll do:</strong> Help younger kids with subjects you're good at</p>
            <p><strong>Pay:</strong> $15-30/hour (depending on subject)</p>
            <p><strong>Best for:</strong> Good students who can explain concepts well</p>
            <p><strong>How to start:</strong> Post on neighborhood apps, tell parents, make flyers</p>
            
            <h4>5. Pet Sitting/Dog Walking</h4>
            <p><strong>What you'll do:</strong> Watch pets when owners are away, walk dogs</p>
            <p><strong>Pay:</strong> $15-25 per walk, $25-50 per day for pet sitting</p>
            <p><strong>Best for:</strong> Animal lovers with flexible schedules</p>
            <p><strong>How to start:</strong> Rover app, neighborhood social media, word of mouth</p>
            
            <h4>6. Babysitting</h4>
            <p><strong>What you'll do:</strong> Watch kids, help with homework, play games</p>
            <p><strong>Pay:</strong> $12-20/hour depending on experience and number of kids</p>
            <p><strong>Best for:</strong> Responsible teens who like working with kids</p>
            <p><strong>How to start:</strong> Care.com, neighborhood groups, family friends</p>
            
            <h4>7. Lawn Care/Snow Removal</h4>
            <p><strong>What you'll do:</strong> Mow lawns, rake leaves, shovel snow</p>
            <p><strong>Pay:</strong> $20-50 per lawn, $25-50 per snow removal</p>
            <p><strong>Best for:</strong> Physical work, seasonal income</p>
            <p><strong>How to start:</strong> Door-to-door flyers, neighborhood apps</p>
            
            <h4>8. Social Media Management</h4>
            <p><strong>What you'll do:</strong> Manage Instagram/TikTok for small businesses</p>
            <p><strong>Pay:</strong> $15-30/hour or per-project basis</p>
            <p><strong>Best for:</strong> Social media savvy teens</p>
            <p><strong>How to start:</strong> Offer to local businesses, build a portfolio</p>
            
            <h4>9. Content Creation</h4>
            <p><strong>What you'll do:</strong> YouTube videos, TikTok content, streaming</p>
            <p><strong>Pay:</strong> Varies widely (could be $0 to thousands)</p>
            <p><strong>Best for:</strong> Creative teens who are comfortable on camera</p>
            <p><strong>Reality check:</strong> Takes time to build an audience</p>
            
            <h4>10. Freelance Skills</h4>
            <p><strong>What you'll do:</strong> Graphic design, writing, video editing, coding</p>
            <p><strong>Pay:</strong> $20-50/hour depending on skill level</p>
            <p><strong>Best for:</strong> Teens with specific creative or technical skills</p>
            <p><strong>Where to find work:</strong> Fiverr, Upwork, local businesses</p>
            
            <h3>📋 Getting Started Checklist</h3>
            <ol>
                <li><strong>Figure out your availability</strong> - How many hours can you realistically work?</li>
                <li><strong>Get working papers</strong> - Most states require work permits for under 18</li>
                <li><strong>Make a simple resume</strong> - Include any volunteer work, good grades, skills</li>
                <li><strong>Practice interview questions</strong> - "Why do you want to work here?" etc.</li>
                <li><strong>Start applying</strong> - Apply to 5-10 places to increase your chances</li>
            </ol>
            
            <h3>⚖️ Balancing Work & School</h3>
            <ul>
                <li>Don't work more than 15-20 hours per week during school</li>
                <li>Choose jobs with flexible schedules if your workload varies</li>
                <li>Communicate with your boss about school commitments</li>
                <li>Remember: school comes first - don't let work hurt your grades</li>
            </ul>
            
            <h3>💰 Making the Most of Your Money</h3>
            <p>Once you start earning:</p>
            <ul>
                <li>Open a checking and savings account</li>
                <li>Save at least 20% of everything you earn</li>
                <li>Track your income and expenses</li>
                <li>Learn about taxes (yes, you might have to pay them!)</li>
            </ul>
            
            <h3>🎯 The Bottom Line</h3>
            <p>Having a job as a teen isn't just about money - it's about learning responsibility, time management, and skills that will help you later. Start small, stay consistent, and don't be afraid to try different things until you find what works for you!</p>
        `
    },
    'smart-spending': {
        title: 'Smart Spending Guide',
        category: 'spending',
        readTime: '5 min read',
        content: `
            <h2>Buy What You Want Without Going Broke</h2>
            <p>Being smart with money isn't about never buying fun stuff - it's about making sure your money goes further and you actually get things you'll love. Here's how to spend smart.</p>
            
            <h3>🧠 The Psychology of Spending</h3>
            <p>Stores spend millions figuring out how to make you buy stuff. Fight back by understanding their tricks:</p>
            <ul>
                <li><strong>"Limited time offers"</strong> create urgency - walk away</li>
                <li><strong>"Buy one, get one"</strong> makes you spend more than planned</li>
                <li><strong>End caps</strong> (displays at aisle ends) have impulse items</li>
                <li><strong>Eye-level products</strong> are usually the most expensive</li>
            </ul>
            
            <h3>💳 The Cash Envelope Challenge</h3>
            <p>Try this for one month: Use cash for everything fun (movies, games, food out). When the cash is gone, you're done spending until next month. You'll spend 20-30% less, guaranteed.</p>
            
            <h3>📱 Apps That Save You Money</h3>
            <ul>
                <li><strong>Rakuten</strong> - Get cash back for online shopping</li>
                <li><strong>Honey</strong> - Automatically finds coupon codes</li>
                <li><strong>Fluz</strong> - Cash back at popular stores</li>
                <li><strong>GasBuddy</strong> - Find cheapest gas near you</li>
            </ul>
            
            <h3>🛍️ Smart Shopping Strategies</h3>
            
            <h4>Before You Buy Anything</h4>
            <ol>
                <li><strong>Wait 24 hours</strong> for purchases over $20</li>
                <li><strong>Check three places</strong> for the best price</li>
                <li><strong>Ask yourself:</strong> "Do I need this or just want it?"</li>
                <li><strong>Calculate cost per use</strong> - expensive but used often = worth it</li>
            </ol>
            
            <h4>Clothes Shopping Smart</h4>
            <ul>
                <li>Buy basics that mix and match</li>
                <li>Check thrift stores first</li>
                <li>Follow brands on social media for sale announcements</li>
                <li>Shop off-season (buy winter coats in spring)</li>
            </ul>
            
            <h4>Video Games & Tech</h4>
            <ul>
                <li>Wait 3 months after release - prices drop</li>
                <li>Buy used games (GameStop, eBay)</li>
                <li>Share digital games with family members</li>
                <li>Consider if you'll really play it before buying</li>
            </ul>
            
            <h4>Food & Drinks</h4>
            <ul>
                <li>Pack lunch 2-3 times per week</li>
                <li>Get a reusable water bottle</li>
                <li>Split meals with friends when eating out</li>
                <li>Happy hour deals and student discounts</li>
            </ul>
            
            <h3>🎯 The Value Calculator</h3>
            <p>Before buying something, calculate its "value score":</p>
            <p><strong>(How many times you'll use it) × (How much you'll enjoy it) ÷ (Cost)</strong></p>
            <p>A $50 gaming console you'll use daily = high value score.</p>
            <p>A $50 trendy shirt you'll wear once = low value score.</p>
            
            <h3>🚫 Things to Avoid</h3>
            <ul>
                <li><strong>Buy Now, Pay Later</strong> - sounds good but leads to overspending</li>
                <li><strong>Store credit cards</strong> - high interest rates</li>
                <li><strong>Impulse subscriptions</strong> - free trials that auto-renew</li>
                <li><strong>"Influencer" purchases</strong> - buying because someone else has it</li>
            </ul>
            
            <h3>💡 Pro Spending Tips</h3>
            <ol>
                <li><strong>Unsubscribe from marketing emails</strong> - less temptation</li>
                <li><strong>Use the "one in, one out" rule</strong> - buy something new, something old goes</li>
                <li><strong>Price match</strong> - many stores will match competitors' prices</li>
                <li><strong>Buy quality over quantity</strong> - one good pair of shoes vs 3 cheap ones</li>
                <li><strong>Share purchases with friends</strong> - split costs on games, movies, tools</li>
            </ol>
            
            <h3>🔄 The Return Policy Game</h3>
            <p>Always check return policies BEFORE buying. Some places make returns impossible or charge restocking fees. Good return policies = Amazon, Costco, Target. Bad policies = final sale items, customized products.</p>
            
            <h3>🎊 When Splurging Makes Sense</h3>
            <p>Sometimes spending more is actually smarter:</p>
            <ul>
                <li>Quality items that last years vs cheap replacements</li>
                <li>Things that save you money long-term (good backpack, quality shoes)</li>
                <li>Experiences vs stuff (concerts, trips with friends)</li>
                <li>Investing in skills or education</li>
            </ul>
            
            <h3>📈 Track Your Spending</h3>
            <p>For one month, track EVERY purchase. You'll be shocked where money goes. Most teens find they're spending way more on small stuff (snacks, apps, random purchases) than they realize.</p>
            
            <h3>🏆 The Goal</h3>
            <p>Smart spending isn't about being cheap - it's about getting maximum value and enjoyment from your money. Buy what matters to you, skip what doesn't, and always think before you swipe.</p>
        `
    },
    'future-planning': {
        title: 'Planning for College & Cars',
        category: 'future',
        readTime: '9 min read',
        content: `
            <h2>Big Goals, Small Steps</h2>
            <p>College, cars, moving out... these feel like huge, impossible goals when you're in high school. But here's the secret: big goals are just small steps repeated over time. Let's break down how to actually save for these major life goals.</p>
            
            <h3>🎓 College Savings: The Reality Check</h3>
            
            <h4>How Much Does College Actually Cost?</h4>
            <p><strong>In-state public college:</strong> $10,000-25,000 per year</p>
            <p><strong>Out-of-state public:</strong> $25,000-40,000 per year</p>
            <p><strong>Private college:</strong> $35,000-60,000 per year</p>
            <p><strong>But don't panic!</strong> Most students don't pay full price.</p>
            
            <h4>Ways to Reduce College Costs</h4>
            <ul>
                <li><strong>Scholarships</strong> - Apply for everything, even small ones</li>
                <li><strong>Community college first</strong> - 2 years at CC, then transfer</li>
                <li><strong>In-state schools</strong> - Usually 1/3 the cost of private</li>
                <li><strong>AP/IB classes</strong> - College credit in high school = less tuition</li>
                <li><strong>FAFSA</strong> - Federal aid, grants, work-study programs</li>
            </ul>
            
            <h4>Realistic College Savings Goals</h4>
            <p>As a teen, aim to save:</p>
            <ul>
                <li><strong>Freshman year:</strong> $500-1,000 total</li>
                <li><strong>Sophomore year:</strong> $1,500-2,500 total</li>
                <li><strong>Junior year:</strong> $3,000-5,000 total</li>
                <li><strong>Senior year:</strong> $5,000-10,000 total</li>
            </ul>
            <p>Even $5,000 saved by graduation is huge - that's textbooks for a year or a semester's tuition at community college.</p>
            
            <h3>🚗 Car Savings: Freedom on Wheels</h3>
            
            <h4>The Real Cost of a Car</h4>
            <p>It's not just the purchase price:</p>
            <ul>
                <li><strong>Car payment:</strong> $200-400/month</li>
                <li><strong>Insurance:</strong> $100-300/month (higher for teens)</li>
                <li><strong>Gas:</strong> $100-200/month</li>
                <li><strong>Maintenance:</strong> $50-100/month average</li>
                <li><strong>Total:</strong> $450-1,000 per month!</li>
            </ul>
            
            <h4>Smart First Car Strategy</h4>
            <ol>
                <li><strong>Save for a reliable used car</strong> ($5,000-8,000)</li>
                <li><strong>Pay cash if possible</strong> - avoid car loans</li>
                <li><strong>Get insurance quotes BEFORE buying</strong></li>
                <li><strong>Have a mechanic inspect used cars</strong></li>
                <li><strong>Factor in ALL costs</strong> before deciding</li>
            </ol>
            
            <h4>Car Savings Timeline</h4>
            <p>Want a $6,000 car by age 17?</p>
            <ul>
                <li>Starting at 15: Save $250/month = $6,000 in 2 years</li>
                <li>Starting at 16: Save $500/month = $6,000 in 1 year</li>
                <li>Summer job focus: Save $2,000 each summer</li>
            </ul>
            
            <h3>🏠 Moving Out: The Ultimate Goal</h3>
            
            <h4>What Moving Out Actually Costs</h4>
            <p><strong>One-time costs:</strong></p>
            <ul>
                <li>Security deposit: $500-1,500</li>
                <li>First month rent: $800-2,000</li>
                <li>Furniture: $1,000-3,000</li>
                <li>Utilities setup: $200-500</li>
                <li><strong>Total startup:</strong> $2,500-7,000</li>
            </ul>
            
            <p><strong>Monthly costs:</strong></p>
            <ul>
                <li>Rent: $800-2,000</li>
                <li>Utilities: $150-300</li>
                <li>Groceries: $200-400</li>
                <li>Internet/phone: $100-150</li>
                <li>Transportation: $150-400</li>
                <li><strong>Total monthly:</strong> $1,400-3,250</li>
            </ul>
            
            <h4>Realistic Moving Out Plan</h4>
            <p>Most people need 3-6 months of expenses saved before moving out. That's $4,200-19,500 depending on where you live.</p>
            
            <h3>💡 Smart Saving Strategies for Big Goals</h3>
            
            <h4>The 50/30/20 Rule (Big Goals Version)</h4>
            <ul>
                <li><strong>50%</strong> - Current needs (food, transport, phone)</li>
                <li><strong>30%</strong> - Current wants (fun, social life)</li>
                <li><strong>20%</strong> - Big goals (college, car, moving out)</li>
            </ul>
            
            <h4>Automated Savings</h4>
            <p>Set up automatic transfers to separate savings accounts:</p>
            <ul>
                <li>College Fund</li>
                <li>Car Fund</li>
                <li>Emergency Fund (for unexpected stuff)</li>
            </ul>
            
            <h4>Make Your Money Work for You</h4>
            <ul>
                <li>High-yield savings accounts (better interest than regular)</li>
                <li>CDs (Certificates of Deposit) for money you won't need soon</li>
                <li>Consider conservative investments for long-term goals</li>
            </ul>
            
            <h3>🎯 Breaking Down Big Goals</h3>
            
            <h4>College Fund Example</h4>
            <p><strong>Goal:</strong> $5,000 by graduation</p>
            <p><strong>Starting sophomore year (3 years):</strong></p>
            <ul>
                <li>$140/month from allowance/job</li>
                <li>$1,000 from summer job</li>
                <li>$500 from birthday/holiday money</li>
                <li>$200 from selling stuff you don't need</li>
                <li><strong>Total:</strong> $5,040</li>
            </ul>
            
            <h4>Car Fund Example</h4>
            <p><strong>Goal:</strong> $6,000 by age 17</p>
            <p><strong>Starting at 15 (2 years):</strong></p>
            <ul>
                <li>$200/month from part-time job</li>
                <li>$1,500 each summer</li>
                <li>$500 from side hustles</li>
                <li><strong>Total:</strong> $6,300</li>
            </ul>
            
            <h3>🔥 Motivation Strategies</h3>
            <ol>
                <li><strong>Visual reminders</strong> - Put pictures of your goals where you'll see them</li>
                <li><strong>Track progress</strong> - Use apps or spreadsheets to watch savings grow</li>
                <li><strong>Celebrate milestones</strong> - Every $1,000 saved, do something small to celebrate</li>
                <li><strong>Find an accountability partner</strong> - Friend saving for similar goals</li>
                <li><strong>Remember your "why"</strong> - Freedom, independence, less stress later</li>
            </ol>
            
            <h3>⚠️ Reality Check</h3>
            <p>Some truths about big goals:</p>
            <ul>
                <li>You won't reach every goal exactly as planned - that's okay</li>
                <li>Sometimes life happens (car breaks, unexpected expenses)</li>
                <li>Goals change - you might want different things in 2 years</li>
                <li>Starting small is better than not starting at all</li>
            </ul>
            
            <h3>🏁 The Bottom Line</h3>
            <p>Big financial goals aren't about being perfect - they're about being consistent. Save what you can, when you can, and adjust as needed. Every dollar saved toward your future is a win, no matter how small the amount.</p>
            
            <p><strong>Remember:</strong> The best time to start saving for big goals was yesterday. The second best time is right now.</p>
        `
    },
    'teen-budgeting': {
        title: 'Budgeting That Actually Works',
        category: 'budgeting',
        readTime: '6 min read',
        content: `
            <h2>Budgeting Without the Headache</h2>
            <p>Most budgeting advice is made for adults with jobs and bills. As a teen, your money situation is totally different. Here's how to budget in a way that actually works for your life.</p>
            
            <h3>🎯 Why Most Teen Budgets Fail</h3>
            <ul>
                <li>They're too complicated (spreadsheets with 50 categories)</li>
                <li>They don't account for irregular income (birthday money, side hustles)</li>
                <li>They're too strict (no fun money = you'll quit)</li>
                <li>They don't match your actual spending patterns</li>
            </ul>
            
            <h3>💡 The 3-Category Budget</h3>
            <p>Forget complicated systems. Start with just three categories:</p>
            <ul>
                <li><strong>Needs (50%)</strong> - Things you absolutely have to buy</li>
                <li><strong>Wants (30%)</strong> - Fun stuff, social life, entertainment</li>
                <li><strong>Savings (20%)</strong> - Future goals, emergency fund</li>
            </ul>
            
            <h4>What goes in each category?</h4>
            <p><strong>Needs (50%):</strong></p>
            <ul>
                <li>Lunch money (if you don't pack)</li>
                <li>Transportation (bus fare, gas for family car)</li>
                <li>Phone bill (if you pay it)</li>
                <li>School supplies</li>
                <li>Essential clothes (when stuff wears out)</li>
            </ul>
            
            <p><strong>Wants (30%):</strong></p>
            <ul>
                <li>Games, apps, in-app purchases</li>
                <li>Movies, concerts, events</li>
                <li>Clothes shopping (beyond basics)</li>
                <li>Eating out with friends</li>
                <li>Snacks, drinks, treats</li>
            </ul>
            
            <p><strong>Savings (20%):</strong></p>
            <ul>
                <li>College fund</li>
                <li>Car savings</li>
                <li>Emergency fund</li>
                <li>Big purchases (phone, laptop)</li>
            </ul>
            
            <h3>📱 Apps That Make Budgeting Easy</h3>
            
            <h4>For Beginners</h4>
            <ul>
                <li><strong>GoHenry/Current</strong> - Debit cards for teens with spending tracking</li>
                <li><strong>Greenlight</strong> - Parent-controlled with savings goals</li>
                <li><strong>FamZoo</strong> - Family banking with chore tracking</li>
            </ul>
            
            <h4>For More Advanced Users</h4>
            <ul>
                <li><strong>Mint</strong> - Free, connects to bank accounts, shows spending patterns</li>
                <li><strong>YNAB</strong> - More detailed, subscription but powerful</li>
                <li><strong>Personal Capital</strong> - Good for tracking savings goals</li>
            </ul>
            
            <h3>📓 The Low-Tech Method</h3>
            <p>Apps aren't for everyone. Try this:</p>
            <ol>
                <li>Get 3 envelopes: Needs, Wants, Savings</li>
                <li>When you get money, split it 50/30/20 into envelopes</li>
                <li>Only spend from the right envelope</li>
                <li>When envelope is empty, you're done for that category</li>
            </ol>
            
            <h3>⚡ Quick Budget Methods</h3>
            
            <h4>The Weekly Reset</h4>
            <p>Every Sunday, decide how you'll spend your money for the week. This works well if you get allowance weekly or have a part-time job.</p>
            
            <h4>The "Pay Yourself First" Method</h4>
            <p>The moment you get money, put 20% in savings BEFORE spending anything. Then budget what's left.</p>
            
            <h4>The Zero-Based Budget</h4>
            <p>Every dollar has a job. Income minus expenses equals zero. Good for when you have consistent income from a job.</p>
            
            <h3>🔄 Adjusting Your Budget</h3>
            
            <h4>When Life Changes</h4>
            <p>Your budget should change when:</p>
            <ul>
                <li>You get a job (more income)</li>
                <li>School starts (different expenses)</li>
                <li>Summer break (more social spending)</li>
                <li>You get a car (gas, insurance costs)</li>
            </ul>
            
            <h4>Monthly Check-ins</h4>
            <p>Once a month, ask yourself:</p>
            <ul>
                <li>Did this budget work for me?</li>
                <li>Where did I overspend?</li>
                <li>What categories need adjusting?</li>
                <li>Am I saving enough for my goals?</li>
            </ul>
            
            <h3>💸 Handling Irregular Money</h3>
            
            <h4>Birthday/Holiday Money</h4>
            <ul>
                <li>50% to long-term savings (college, car)</li>
                <li>30% to something fun you want now</li>
                <li>20% to emergency fund</li>
            </ul>
            
            <h4>Side Hustle Income</h4>
            <ul>
                <li>Save 30% for taxes (yes, teens might owe taxes)</li>
                <li>40% to specific goals</li>
                <li>30% to current wants</li>
            </ul>
            
            <h3>🚫 Budgeting Mistakes to Avoid</h3>
            
            <h4>Common Teen Budget Fails</h4>
            <ul>
                <li><strong>Forgetting small purchases</strong> - snacks, apps, random stuff adds up</li>
                <li><strong>Being too strict</strong> - no fun budget = you'll give up entirely</li>
                <li><strong>Not tracking</strong> - you can't budget if you don't know where money goes</li>
                <li><strong>Comparing to friends</strong> - everyone's situation is different</li>
                <li><strong>Giving up after one mistake</strong> - budgets take time to perfect</li>
            </ul>
            
            <h3>🎯 Making Your Budget Stick</h3>
            
            <h4>Week 1: Track Everything</h4>
            <p>Write down EVERY purchase for one week. No judgment, just data. You'll be surprised where money actually goes.</p>
            
            <h4>Week 2: Set Up Your System</h4>
            <p>Choose your method (app, envelope, spreadsheet) and set up your 50/30/20 categories.</p>
            
            <h4>Week 3: Test Drive</h4>
            <p>Try following your budget. Don't worry if it's perfect - just see how it feels.</p>
            
            <h4>Week 4: Adjust and Continue</h4>
            <p>Tweak what's not working and keep going. Budgeting gets easier with time.</p>
            
            <h3>💪 Pro Tips</h3>
            <ol>
                <li><strong>Use cash for fun spending</strong> - you'll spend less when you see the money leave</li>
                <li><strong>Automate savings</strong> - set up transfers so you don't have to think about it</li>
                <li><strong>Have a "splurge fund"</strong> - guilt-free spending money</li>
                <li><strong>Review with parents</strong> - they can help spot things you're missing</li>
                <li><strong>Celebrate small wins</strong> - stuck to your budget for a month? Do something fun</li>
            </ol>
            
            <h3>🏆 The Goal</h3>
            <p>A good teen budget isn't about restriction - it's about control. When you budget, you're telling your money where to go instead of wondering where it went. Start simple, stay consistent, and adjust as needed.</p>
            
            <p><strong>Remember:</strong> The perfect budget doesn't exist. The best budget is the one you'll actually stick with.</p>
        `
    },
    'college-apps': {
        title: 'College Applications Without Breaking the Bank',
        category: 'future',
        readTime: '10 min read',
        content: `
            <h2>Smart Ways to Apply to College</h2>
            <p>College applications can cost hundreds of dollars if you're not careful. But there are ways to apply to multiple schools without going broke. Here's how to navigate the college application process on a budget.</p>
            
            <h3>💰 The Real Cost of College Applications</h3>
            
            <h4>Application Fees</h4>
            <p>Most colleges charge between $50-100 per application:</p>
            <ul>
                <li><strong>State schools:</strong> $50-75</li>
                <li><strong>Private schools:</strong> $75-100</li>
                <li><strong>Prestigious schools:</strong> $90-100+</li>
            </ul>
            
            <p>Applying to 10 schools could cost $500-1000 just in fees!</p>
            
            <h4>Other Hidden Costs</h4>
            <ul>
                <li>SAT/ACT test fees: $55-65 each</li>
               >SAT score reports: $12 per school</li>
               >ACT score reports: $16 per school</li>
                <li>Portfolio fees (for art/design schools): $10-30</li>
                <li>Transcript fees: $2-5 per school</li>
            </ul>
            
            <h3>🎯 How to Save Money on Applications</h3>
            
            <h4>Fee Waivers</h4>
            <p>Many colleges offer application fee waivers if you qualify:</p>
            <ul>
                <li><strong>Family income requirements:</strong> Usually under $65,000-80,000</li>
                <li><strong>First-generation student:</strong> First in family to attend college</li>
                <li><strong>Participate in fee waiver programs:</strong> College Board, NACAC</li>
                <li><strong>Meet specific criteria:</strong> Each school has different requirements</li>
            </ul>
            
            <h4>How to Get Fee Waivers</h4>
            <ol>
                <li>Check the Common Application fee waiver section</li>
                <li>Ask your school counselor (they can often help)</li>
                <li>Contact college admissions offices directly</li>
                <li>Look for "fee waiver eligible" on college websites</li>
            </ol>
            
            <h4>Free Application Days</h4>
            <p>Some states offer free application days:</p>
            <ul>
                <li><strong>Georgia:</strong> Georgia Apply to College Month</li>
                <li><strong>North Carolina:</strong> CFNC Free Application Week</li>
                <li><strong>Michigan:</strong> Michigan College Month</li>
                <li><strong>Check your state's education website</strong> for similar programs</li>
            </ul>
            
            <h3>📝 Smart Application Strategy</h3>
            
            <h4>Target Schools vs. Reach Schools</h4>
            <p>Instead of applying to 15+ schools, be strategic:</p>
            <ul>
                <li><strong>2-3 Safety schools:</strong> Where you're almost guaranteed admission</li>
                <li><strong>3-5 target schools:</strong> Where you have a good chance</li>
                <li><strong>2-3 reach schools:</strong> Where admission is possible but not guaranteed</li>
            </ul>
            
            <h4>Use the Common Application</h4>
            <p>Over 900 schools accept the Common App:</p>
            <ul>
                <li><strong>One application for multiple schools</strong></li>
                <li><strong>Reuse essays and recommendations</strong></li>
                <li><strong>Track all deadlines in one place</strong></li>
                <li><strong>Some schools waive fees for Common App users</strong></li>
            </ul>
            
            <h3>🧪 Test Score Strategies</h3>
            
            <h4>SAT/ACT Score Choice</h4>
            <p>Both tests let you choose which scores to send:</p>
            <ul>
                <li><strong>Only send your best scores</strong></li>
                <li><strong>Don't send scores that hurt your application</strong></li>
                <li><strong>Some schools are test-optional</strong> - check before paying to send scores</li>
            </ul>
            
            <h4>Free Test Prep Resources</h4>
            <ul>
                <li><strong>Khan Academy</strong> - Free SAT prep</li>
                <li><strong>ACT Academy</strong> - Free ACT prep</li>
                <li><strong>Your school's test prep programs</strong></li>
                <li><strong>Library resources</strong> - Many have test prep books</li>
            </ul>
            
            <h3>📚 Essay and Portfolio Tips</h3>
            
            <h4>Reuse Essays When Possible</h4>
            <ul>
                <li><strong>Common App essay</strong> - Goes to all Common App schools</li>
                <li><strong>Prompt variations</strong> - Adapt one essay for multiple prompts</li>
                <li><strong>Supplemental essays</strong> - These usually need to be unique</li>
            </ul>
            
            <h4>Free Essay Help</h4>
            <ul>
                <li><strong>English teachers</strong> - They often help students with college essays</li>
                <li><strong>School counselors</strong> - Can review and provide feedback</li>
                <li><strong>Writing centers</strong> - Some colleges offer free essay reviews</li>
                <li><strong>Peer review</strong> - Exchange essays with friends</li>
            </ul>
            
            <h3>🎓 Scholarship Applications</h3>
            
            <h4>Apply for Scholarships Early</h4>
            <ul>
                <li><strong>Many scholarships have early deadlines</strong></li>
                <li><strong>Some require separate applications</strong></li>
                <li><strong>Local scholarships often have less competition</strong></li>
                <li><strong>Apply for small scholarships too</strong> - they add up!</li>
            </ul>
            
            <h4>Free Scholarship Search</h4>
            <ul>
                <li><strong>Scholarships.com</strong> - Free database</li>
                <li><strong>Fastweb</strong> - Free, but requires registration</li>
                <li><strong>Your school's counseling office</strong> - Local scholarships</li>
                <li><strong>Community organizations</strong> - Rotary, Elks, etc.</li>
            </ul>
            
            <h3>💡 Money-Saving Application Timeline</h3>
            
            <h4>Junior Year (Spring)</h4>
            <ul>
                <li>Research schools and costs</li>
                <li>Start preparing for SAT/ACT</li>
                <li>Begin scholarship search</li>
                <li>Visit colleges if possible</li>
            </ul>
            
            <h4>Summer Before Senior Year</h4>
            <ul>
                <li>Take SAT/ACT if needed</li>
                <li>Start drafting essays</li>
                <li>Ask for recommendation letters</li>
                <li>Apply for early scholarships</li>
            </ul>
            
            <h4>Senior Year (Fall)</h4>
            <ul>
                <li>Submit applications (use fee waivers when possible)</li>
                <li>Apply for FAFSA (opens October 1)</li>
                <li>Continue scholarship applications</li>
                <li>Send test scores strategically</li>
            </ul>
            
            <h4>Senior Year (Spring)</h4>
            <ul>
                <li>Compare financial aid packages</li>
                <li>Apply for additional scholarships</li>
                <li>Make your final decision</li>
                <li>Notify schools by May 1</li>
            </ul>
            
            <h3>🚫 Application Mistakes to Avoid</h3>
            
            <h4>Costly Mistakes</h4>
            <ul>
                <li><strong>Applying to too many schools</strong> - Focus on quality over quantity</li>
                <li><strong>Not checking for fee waivers</strong> - You might qualify!</li>
                <li><strong>Missing deadlines</strong> - Some schools don't accept late applications</li>
                <li><strong>Paying for services you don't need</strong> - Essay editing, application coaching</li>
                <li><strong>Not applying for scholarships</strong> - Free money you're leaving on the table</li>
            </ul>
            
            <h3>🏆 The Bottom Line</h3>
            <p>College applications don't have to break the bank. With strategic planning, fee waivers, and smart choices, you can apply to multiple schools for under $100 in total fees.</p>
            
            <p><strong>Remember:</strong> The money you save on applications can go toward your college education itself!</p>
        `
    },
    'side-hustles': {
        title: 'Side Hustles That Actually Work for Teens',
        category: 'earning',
        readTime: '8 min read',
        content: `
            <h2>Make Money Without a Traditional Job</h2>
            <p>Not everyone can get a traditional part-time job. Maybe you don't have transportation, or your schedule is too packed with sports and homework. But there are plenty of ways to make money on your own schedule. Here are side hustles that actually work for teens.</p>
            
            <h3>💻 Digital Side Hustles</h3>
            
            <h4>1. Social Media Management</h4>
            <p>Local businesses need help with Instagram, TikTok, and Facebook:</p>
            <ul>
                <li><strong>What you'll do:</strong> Create posts, respond to comments, run small ad campaigns</li>
                <li><strong>Skills needed:</strong> Good with social media, basic marketing knowledge</li>
                <li><strong>Earnings:</strong> $15-30/hour or $200-500/month per client</li>
                <li><strong>How to start:</strong> Offer to manage a local business's social media for free for a month, then charge</li>
            </ul>
            
            <h4>2. Content Creation</h4>
            <p>YouTube, TikTok, Instagram can make money if you build an audience:</p>
            <ul>
                <li><strong>Popular niches for teens:</strong> Gaming, study tips, comedy, fashion, tech reviews</li>
                <li><strong>Monetization:</strong> Ads, sponsorships, affiliate links (after building audience)</li>
                <li><strong>Reality check:</strong> Takes 6-12 months to start earning money</li>
                <li><strong>Start small:</strong> Post consistently, focus on quality over quantity</li>
            </ul>
            
            <h4>3. Freelance Writing</h4>
            <p>If you're good at writing, you can get paid for it:</p>
            <ul>
                <li><strong>Types of writing:</strong> Blog posts, social media content, product descriptions</li>
                <li><strong>Where to find work:</strong> Upwork, Fiverr, local businesses</li>
                <li><strong>Earnings:</strong> $20-50/hour depending on experience</li>
                <li><strong>Build a portfolio:</strong> Write sample articles to show clients</li>
            </ul>
            
            <h4>4. Graphic Design</h4>
            <p>Design logos, social media graphics, posters:</p>
            <ul>
                <li><strong>Tools to learn:</strong> Canva (free), Adobe Express (free), GIMP (free)</li>
                <li><strong>Skills needed:</strong> Good eye for design, basic computer skills</li>
                <li><strong>Where to find work:</strong> Fiverr, 99designs, local businesses</li>
                <li><strong>Earnings:</strong> $25-75 per design</li>
            </ul>
            
            <h3>🏠 Local Services</h3>
            
            <h4>5. Tech Support for Seniors</h4>
            <p>Help older adults with technology:</p>
            <ul>
                <li><strong>Services:</strong> Setting up smartphones, teaching Zoom, fixing computer issues</li>
                <li><strong>Marketing:</strong> Post flyers at community centers, libraries</li>
                <li><strong>Earnings:</strong> $20-40/hour</li>
                <li><strong>Benefits:</strong> Flexible schedule, helping people, building references</li>
            </ul>
            
            <h4>6. Academic Tutoring</h4>
            <p>Help younger students with schoolwork:</p>
            <ul>
                <li><strong>Subjects in demand:</strong> Math, science, English, foreign languages</li>
                <li><strong>Earnings:</strong> $15-30/hour depending on subject and location</li>
                <li><strong>How to start:</strong> Tell parents, post on neighborhood apps, ask teachers for referrals</li>
                <li><strong>Requirements:</strong> Good grades in subjects you want to tutor</li>
            </ul>
            
            <h4>7. Music Lessons</h4>
            <p>If you play an instrument, teach beginners:</p>
            <ul>
                <li><strong>Popular instruments:</strong> Piano, guitar, ukulele, violin</li>
                <li><strong>Earnings:</strong> $20-40/hour for 30-minute lessons</li>
                <li><strong>Teach what you know:</strong> You don't need to be an expert, just better than beginners</li>
                <li><strong>Location:</strong> Your house, their house, or online via Zoom</li>
            </ul>
            
            <h4>8. Pet Services</h4>
            <p>Beyond basic dog walking:</p>
            <ul>
                <li><strong>Pet sitting:</strong> $25-50/day for overnight care</li>
                <li><strong>Dog training:</strong> Basic obedience training, $30-50/hour</li>
                <li><strong>Pet photography:</strong> $20-40 per session for pet owners</li>
                <li><strong>Grooming basics:</strong> Bathing, nail trimming for small dogs</li>
            </ul>
            
            <h3>🛍️ Creative Ventures</h3>
            
            <h4>9. Custom Crafts</h4>
            <p>Make and sell things people want:</p>
            <ul>
                <li><strong>Popular items:</strong> Jewelry, custom t-shirts, phone cases, art prints</li>
                <li><strong>Where to sell:</strong> Etsy, Instagram, local craft fairs, school events</li>
                <li><strong>Startup costs:</strong> Usually under $50 for materials</li>
                <li><strong>Tips:</strong> Start with one product, get good at it, then expand</li>
            </ul>
            
            <h4>10. Photography Services</h4>
            <p>Take photos for people and events:</p>
            <ul>
                <li><strong>Types:</strong> Senior photos, family portraits, event photography</li>
                <li><strong>Equipment needed:</strong> Decent smartphone or basic DSLR camera</li>
                <li><strong>Earnings:</strong> $50-200 per session depending on type</li>
                <li><strong>Build portfolio:</strong> Offer free sessions to friends first</li>
            </ul>
            
            <h4>11. Reselling Flips</h4>
            <p>Buy low, sell high:</p>
            <ul>
                <li><strong>What to flip:</strong> Clothes from thrift stores, furniture, electronics, sports equipment</li>
                <li><strong>Where to sell:</strong> Facebook Marketplace, Depop, Poshmark, eBay</li>
                <li><strong>Strategy:</strong> Clean items well, take good photos, research prices</li>
                <li><strong>Earnings:</strong> Varies widely, but can make $100-500/month</li>
            </ul>
            
            <h4>12. Event Help</h4>
            <p>Help with parties and events:</p>
            <ul>
                <li><strong>Services:</strong> Setup, cleanup, serving food, basic photography</li>
                <li><strong>Types of events:</strong> Birthday parties, family gatherings, community events</li>
                <li><strong>Earnings:</strong> $15-25/hour plus tips</li>
                <li><strong>How to find work:</strong> Word of mouth, local Facebook groups</li>
            </ul>
            
            <h3>💰 Managing Your Side Hustle Money</h3>
            
            <h4>Track Your Income</h4>
            <ul>
                <li><strong>Separate bank account</strong> - Keep business money separate</li>
                <li><strong>Save receipts</strong> - For tax deductions</li>
                <li><strong>Track expenses</strong> - Materials, transportation, software</li>
                <li><strong>Set aside money for taxes</strong> - 25-30% of earnings</li>
            </ul>
            
            <h4>Price Your Services</h4>
            <ul>
                <li><strong>Research competitors</strong> - See what others charge locally</li>
                <li><strong>Start slightly lower</strong> - Build reputation, then raise prices</li>
                <li><strong>Offer packages</strong> - Bundle services for better value</li>
                <li><strong>Be confident</strong> - Don't undervalue your skills</li>
            </ul>
            
            <h3>📱 Marketing Your Side Hustle</h3>
            
            <h4>Build Your Brand</h4>
            <ul>
                <li><strong>Professional social media</strong> - Create business accounts</li>
                <li><strong>Simple website or portfolio</strong> - Show off your work</li>
                <li><strong>Business cards</strong> - Hand out to potential clients</li>
                <li><strong>Ask for reviews</strong> - Build social proof</li>
            </ul>
            
            <h4>Find Your First Clients</h4>
            <ul>
                <li><strong>Start with friends and family</strong> - They're your first customers</li>
                <li><strong>Ask for referrals</strong> - Word of mouth is powerful</li>
                <li><strong>Join local groups</strong> - Facebook groups, community centers</li>
                <li><strong>Partner with complementary businesses</strong> - Photographers with event planners</li>
            </ul>
            
            <h3>⚖️ Legal and Safety Considerations</h3>
            
            <h4>Stay Legal</h4>
            <ul>
                <li><strong>Check local regulations</strong> - Some areas require business licenses</li>
                <li><strong>Parental permission</strong> - Make sure your parents approve</li>
                <li><strong>Written agreements</strong> - Simple contracts for bigger jobs</li>
                <li><strong>Insurance considerations</strong> - For activities with risk</li>
            </ul>
            
            <h4>Stay Safe</h4>
            <ul>
                <li><strong>Meet in public places</strong> - Coffee shops, libraries</li>
                <li><strong>Let parents know where you are</strong> - Share location and time</li>
                <li><strong>Trust your instincts</strong> - If something feels wrong, it probably is</li>
                <li><strong>Bring a friend</strong> - For jobs with new clients</li>
            </ul>
            
            <h3>🎯 Tips for Success</h3>
            
            <h4>Start Small</h4>
            <ul>
                <li><strong>Don't quit your day job</strong> - Keep school as priority</li>
                <li><strong>Choose one side hustle</strong> - Master it before adding others</li>
                <li><strong>Be reliable</strong> - Show up on time, do quality work</li>
                <li><strong>Communicate well</strong> - Keep clients updated</li>
            </ul>
            
            <h4>Scale Up</h4>
            <ul>
                <li><strong>Reinvest earnings</strong> - Better equipment, marketing</li>
                <li><strong>Build systems</strong> - Templates, processes for efficiency</li>
                <li><strong>Outsource when possible</strong> - Focus on your strengths</li>
                <li><strong>Network constantly</strong> - Your next client comes from your last one</li>
            </ul>
            
            <h3>🏆 The Bottom Line</h3>
            <p>Side hustles can teach you valuable business skills while making good money. Start small, be professional, and don't be afraid to charge what you're worth. The experience you gain now will help you throughout your career.</p>
            
            <p><strong>Remember:</strong> The best side hustle is one you enjoy and can do consistently. Pick something that interests you and give it your best effort!</p>
        `
    },
    'credit-cards': {
        title: 'Credit Cards for Teens: What You Need to Know',
        category: 'future',
        readTime: '7 min read',
        content: `
            <h2>Understanding Credit Cards Before You Turn 18</h2>
            <p>Credit cards can be powerful tools or dangerous traps. Learning how they work now can save you from expensive mistakes later. Here's everything teens need to know about credit cards.</p>
            
            <h3>💳 What Actually Is a Credit Card?</h3>
            
            <h4>The Basics</h4>
            <p>A credit card is basically a short-term loan from a bank:</p>
            <ul>
                <li><strong>You borrow money</strong> to make purchases</li>
                <li><strong>You have a grace period</strong> (usually 21-25 days) to pay it back</li>
                <li><strong>If you pay in full</strong> during grace period, no interest charged</li>
                <li><strong>If you carry a balance</strong>, you pay high interest on remaining amount</li>
            </ul>
            
            <h4>Credit Limit</h4>
            <p>This is the maximum amount you can borrow:</p>
            <ul>
                <li><strong>Student cards:</strong> Usually $500-2,000</li>
                <li><strong>Secured cards:</strong> Equals your security deposit</li>
                <li><strong>Au</strong> <strong>thorized user cards:</strong> Limit set by primary cardholder</li>
            </ul>
            
            <h3>📋 Types of Credit Cards Available to Teens</h3>
            
            <h4>Authorized User Cards</h4>
            <p>Most common option for teens under 18:</p>
            <ul>
                <li><strong>How it works:</strong> Added to parent's existing credit card</li>
                <li><strong>Pros:</strong> No credit check, builds credit history, parent controls</li>
                <li><strong>Cons:</strong> Parent responsible for charges, limited independence</li>
                <li><strong>Best for:</strong> Learning responsible credit use with parental guidance</li>
            </ul>
            
            <h4>Student Credit Cards</h4>
            <p>Available to college students (18+):</p>
            <ul>
                <li><strong>Requirements:</strong> Proof of enrollment, income (part-time job, allowance)</li>
                <li><strong>Benefits:</strong> Cash back, rewards, lower interest rates</li>
                <li><strong>Popular options:</strong> Discover Student, Chase Freedom Student, Capital One Journey</li>
                <li><strong>Credit limits:</strong> Usually start at $500-1,000</li>
            </ul>
            
            <h4>Secured Credit Cards</h4>
            <p>Available to anyone 18+ with security deposit:</p>
            <ul>
                <li><strong>How it works:</strong> You deposit $200-500, that becomes your credit limit</li>
                <li><strong>Benefits:</strong> Builds credit, graduates to unsecured cards after 6-12 months</li>
                <li><strong>Security deposit:</strong> Refundable when you close account or upgrade</li>
                <li><strong>Good option:</strong> If you can't get approved for regular cards</li>
            </ul>
            
            <h3>💰 Understanding Interest and Fees</h3>
            
            <h4>Interest Rates (APR)</h4>
            <p>This is what you pay if you don't pay in full:</p>
            <ul>
                <li><strong>Student cards:</strong> 15-25% APR</li>
                <li><strong>Regular cards:</strong> 18-30% APR for most people</li>
                <li><strong>Store cards:</strong> Often 25-30% APR</li>
                <li><strong>Cash advances:</strong> Even higher rates + fees</li>
            </ul>
            
            <h4>Common Fees</h4>
            <ul>
                <li><strong>Annual fee:</strong> $0-95 (many student cards have no annual fee)</li>
                <li><strong>Late payment fee:</strong> $25-40</li>
                <li><strong>Cash advance fee:</strong> 3-5% of amount</li>
                <li><strong>Foreign transaction fee:</strong> 3% of purchases abroad</li>
            </ul>
            
            <h3>📈 How Credit Cards Affect Your Credit Score</h3>
            
            <h4>What Builds Good Credit</h4>
            <ul>
                <li><strong>Pay on time</strong> - Payment history is 35% of your score</li>
                <li><strong>Keep balances low</strong> - Use less than 30% of your limit</li>
                <li><strong>Keep old accounts open</strong> - Length of credit history matters</li>
                <li><strong>Apply sparingly</strong> - Too many applications hurts your score</li>
            </ul>
            
            <h4>What Hurts Your Credit</h4>
            <ul>
                <li><strong>Late payments</strong> - Can stay on your report for 7 years</li>
                <li><strong>High credit utilization</strong> - Using too much of your available credit</li>
                <li><strong>Too many inquiries</strong> - Multiple applications in short time</li>
                <li><strong>Maxed out cards</strong> - Using 90%+ of your limit</li>
            </ul>
            
            <h3>🎯 Smart Credit Card Strategies</h3>
            
            <h4>The Golden Rule</h4>
            <p><strong>Never charge more than you can pay off in full each month.</strong></p>
            <ul>
                <li><strong>Use for planned purchases only</strong> - Not impulse buys</li>
                <li><strong>Track your spending</strong> - Know what you're charging</li>
                <li><strong>Set up autopay</strong> - Never miss a payment</li>
                <li><strong>Pay statement balance in full</strong> - Avoid interest completely</li>
            </ul>
            
            <h4>Building Credit Safely</h4>
            <ul>
                <li><strong>Start with one card</strong> - Don't apply for multiple at once</li>
                <li><strong>Use it regularly</strong> - Make small purchases each month</li>
                <li><strong>Pay in full</strong> - Set up automatic payments</li>
                <li><strong>Monitor statements</strong> - Check for errors or fraud</li>
                <li><strong>Keep utilization low</strong> - Use less than 30% of limit</li>
            </ul>
            
            <h3>⚠️ Warning Signs of Credit Trouble</h3>
            
            <h4>Danger Signals</h4>
            <ul>
                <li><strong>Using credit cards for everyday expenses</strong> - Like food, gas, bills</li>
                <li><strong>Making only minimum payments</strong> - Interest adds up fast</li>
                <li><strong>Applying for new cards to pay off old ones</strong> - Dangerous cycle</li>
                <li><strong>Hiding purchases from parents</strong> - Sign of financial trouble</li>
                <li><strong>Maxing out cards</strong> - Can't afford current lifestyle</li>
            </ul>
            
            <h4>What to Do If You're in Trouble</h4>
            <ul>
                <li><strong>Stop using cards immediately</strong> - Cut them up if needed</li>
                <li><strong>Talk to your parents</strong> - They can help you make a plan</li>
                <li><strong>Create a budget</strong> - Figure out where your money is going</li>
                <li><strong>Focus on paying off highest interest cards first</strong></li>
                <li><strong>Consider a part-time job</strong> - Extra income helps pay down debt</li>
            </ul>
            
            <h3>🔒 Protecting Yourself from Fraud</h3>
            
            <h4>Security Tips</h4>
            <ul>
                <li><strong>Never share card details</strong> - Not even with friends</li>
                <li><strong>Use secure websites</strong> - Look for https:// in address bar</li>
                <li><strong>Monitor statements</strong> - Check for charges you didn't make</li>
                <li><strong>Report lost cards immediately</strong> - Call the card company right away</li>
                <li><strong>Use strong passwords</strong> - For online accounts</li>
            </ul>
            
            <h4>Common Scams Targeting Teens</h4>
            <ul>
                <li><strong>"Free trial" offers</strong> - That auto-renew into expensive subscriptions</li>
                <li><strong>"Get rich quick" schemes</strong> - Require upfront fees</li>
                <li><strong>Phishing emails</strong> - Fake emails asking for card information</li>
                <li><strong>Too-good-to-be-true deals</strong> - Usually scams</li>
            </ul>
            
            <h3>💡 Credit Card Alternatives</h3>
            
            <h4>Debit Cards</h4>
            <ul>
                <li><strong>How they work:</strong> Money comes directly from your bank account</li>
                <li><strong>Pros:</strong> Can't overspend, no interest, accepted everywhere</li>
                <li><strong>Cons:</strong> Don't build credit, fewer fraud protections</li>
                <li><strong>Best for:</strong> Everyday spending, learning to manage money</li>
            </ul>
            
            <h4>Prepaid Cards</h4>
            <ul>
                <li><strong>How they work:</strong> Load money onto card, spend until it's empty</li>
                <li><strong>Pros:</strong> Can't overspend, no credit check required</li>
                <li><strong>Cons:</strong> Often have fees, don't build credit</li>
                <li><strong>Best for:</strong> Teens who want plastic without credit risks</li>
            </ul>
            
            <h3>🎓 Preparing for Future Credit</h3>
            
            <h4>Before You Get Your First Card</h4>
            <ul>
                <li><strong>Open a checking account</strong> - Learn to manage bank account</li>
                <li><strong>Get a debit card</strong> - Practice responsible plastic use</li>
                <li><strong>Learn to budget</strong> - Track income and expenses</li>
                <li><strong>Save regularly</strong> - Build emergency fund first</li>
                <li><strong>Understand interest</strong> - Learn how compound interest works</li>
            </ul>
            
            <h4>When You're Ready for Credit</h4>
            <ul>
                <li><strong>Start with secured card</strong> - Safest way to build credit</li>
                <li><strong>Keep credit utilization low</strong> - Use only for small purchases</li>
                <li><strong>Set up automatic payments</strong> - Never miss due dates</li>
                <li><strong>Monitor your credit</strong> - Use free credit monitoring services</li>
                <li><strong>Graduate to better cards</strong> - As your credit improves</li>
            </ul>
            
            <h3>🏆 The Bottom Line</h3>
            <p>Credit cards are powerful financial tools that can help you build credit or lead to serious debt. The difference is knowledge and discipline. Use them responsibly, pay in full each month, and they'll help you achieve your financial goals faster.</p>
            
            <p><strong>Remember:</strong> The best credit card strategy is to treat it like a debit card - only spend what you have, and pay it off completely each month.</p>
        `
    },
    'scholarships': {
        title: 'Scholarship Guide: Finding Free Money for College',
        category: 'future',
        readTime: '9 min read',
        content: `
            <h2>How to Find and Win Scholarships</h2>
            <p>College is expensive, but there's billions of dollars in scholarships available. Most scholarships go unclaimed because students don't know where to look or don't apply correctly. Here's how to find and win scholarships for college.</p>
            
            <h3>💰 The Scholarship Landscape</h3>
            
            <h4>How Much Money is Available?</h4>
            <ul>
                <li><strong>Total available:</strong> Over $6 billion in scholarships annually</li>
                <li><strong>Average award:</strong> $2,000-10,000 per scholarship</li>
                <li><strong>Unclaimed money:</strong> Millions go unused each year</li>
                <li><strong>Your competition:</strong> Most students don't apply for many scholarships</li>
            </ul>
            
            <h4>Types of Scholarships</h4>
            <ul>
                <li><strong>Merit-based:</strong> Academic, athletic, artistic achievements</li>
                <li><strong>Need-based:</strong> Family income and financial need</li>
                <li><strong>Identity-based:</strong> Ethnicity, gender, religion, background</li>
                <li><strong>Career-specific:</strong> STEM, healthcare, teaching, etc.</li>
                <li><strong>Community-based:</strong> Local organizations, businesses</li>
            </ul>
            
            <h3>🔍 Where to Find Scholarships</h3>
            
            <h4>Online Scholarship Databases</h4>
            <ul>
                <li><strong>Scholarships.com</strong> - Largest database, free to use</li>
                <li><strong>Fastweb</strong> - Good matching algorithm, requires registration</li>
                <li><strong>Scholly</strong> - Mobile-first, AI-powered matching</li>
                <li><strong>Cappex</strong> - Comprehensive database with college info</li>
                <li><strong>Niche.com</strong> - Scholarship finder with college reviews</li>
            </ul>
            
            <h4>Local Sources</h4>
            <ul>
                <li><strong>Your high school counseling office</strong> - Local scholarships</li>
                <li><strong>Community foundations</strong> - Often less competitive</li>
                <li><strong>Local businesses</strong> - Companies in your area</li>
                <li><strong>Religious organizations</strong> - Churches, temples, mosques</li>
                <li><strong>Civic groups</strong> - Rotary, Elks, Kiwanis, Lions Club</li>
            </ul>
            
            <h4>College-Specific Scholarships</h4>
            <ul>
                <li><strong>Academic merit scholarships</strong> - Based on GPA/test scores</li>
                <li><strong>Talent scholarships</strong> - Music, art, theater, athletics</li>
                <li><strong>Departmental scholarships</strong> - For specific majors</li>
                <li><strong>Alumni scholarships</strong> - For children of graduates</li>
                <li><strong>Regional scholarships</strong> - Students from specific areas</li>
            </ul>
            
            <h3>📝 Scholarship Application Strategy</h3>
            
            <h4>Create a Scholarship Resume</h4>
            <p>Keep track of your achievements:</p>
            <ul>
                <li><strong>Academic:</strong> GPA, class rank, test scores, AP/IB classes</li>
                <li><strong>Extracurricular:</strong> Clubs, sports, volunteer work, leadership</li>
                <li><strong>Work experience:</strong> Jobs, internships, babysitting, lawn care</li>
                <li><strong>Awards:</strong> Academic, athletic, community service</li>
                <li><strong>Skills:</strong> Languages, computer skills, artistic talents</li>
            </ul>
            
            <h4>Master the Essay</h4>
            <ul>
                <li><strong>Read the prompt carefully</strong> - Address every part</li>
                <li><strong>Tell your story</strong> - Be authentic and personal</li>
                <li><strong>Focus on growth</strong> - How challenges shaped you</li>
                <li><strong>Connect to the scholarship</strong> - Why you're a good fit</li>
                <li><strong>Proofread carefully</strong> - No grammar or spelling errors</li>
            </ul>
            
            <h4>Get Great Recommendations</h4>
            <ul>
                <li><strong>Choose wisely:</strong> Teachers who know you well</li>
                <li><strong>Ask early</strong> - Give recommenders plenty of time</li>
                <li><strong>Provide materials:</strong> Resume, essay, achievements list</li>
                <li><strong>Follow up</strong> - Thank recommenders afterwards</li>
                <li><strong>Waive your right to see</strong> - Recs are more honest this way</li>
            </ul>
            
            <h3>🎯 Scholarship Application Timeline</h3>
            
            <h4>Freshman/Sophomore Year</h4>
            <ul>
                <li><strong>Focus on grades</strong> - Most important factor</li>
                <li><strong>Join clubs</strong> - Build leadership experience</li>
                <li><strong>Volunteer regularly</strong> - Community service looks great</li>
                <li><strong>Start saving achievements</strong> - Document everything</li>
                <li><strong>Practice writing</strong> - Essays get better with practice</li>
            </ul>
            
            <h4>Junior Year</h4>
            <ul>
                <li><strong>Take PSAT/NMSQT</strong> - Opens scholarship opportunities</li>
                <li><strong>Start scholarship search</strong> - Create list of opportunities</li>
                <li><strong>Ask for recommendations</strong> - From junior year teachers</li>
                <li><strong>Write practice essays</strong> - Common scholarship prompts</li>
                <li><strong>Apply for early deadlines</strong> - Some scholarships have junior year deadlines</li>
            </ul>
            
            <h4>Summer Before Senior Year</h4>
            <ul>
                <li><strong>Finalize scholarship list</strong> - Prioritize by deadline and amount</li>
                <li><strong>Write essays</strong> - Create templates, customize for each</li>
                <li><strong>Request transcripts</strong> - Get multiple copies</li>
                <li><strong>Ask for recommendations</strong> - From senior year teachers</li>
                <li><strong>Apply for early scholarships</strong> - Many have October/November deadlines</li>
            </ul>
            
            <h4>Senior Year Fall</h4>
            <ul>
                <li><strong>Apply for FAFSA</strong> - Opens October 1st, do it early</li>
                <li><strong>Submit applications</strong> - Aim for 10-15 per week</li>
                <li><strong>Track deadlines</strong> - Use spreadsheet or calendar</li>
                <li><strong>Follow up</strong> - Confirm applications were received</li>
                <li><strong>Apply for local scholarships</strong> - Often less competitive</li>
            </ul>
            
            <h4>Senior Year Spring</h4>
            <ul>
                <li><strong>Continue applying</strong> - Many deadlines in February/March</li>
                <li><strong>Accept awards</strong> - Notify schools of scholarships received</li>
                <li><strong>Thank donors</strong> - Send thank-you notes to scholarship providers</li>
                <li><strong>Report external scholarships</strong> - To colleges for financial aid</li>
            </ul>
            
            <h3>🏆 Scholarship Categories to Target</h3>
            
            <h4>Academic Merit Scholarships</h4>
            <ul>
                <li><strong>National Merit Scholarship</strong> - PSAT-based, up to $2,500</li>
                <li><strong>Coca-Cola Scholars</strong> - Leadership, community service</li>
                <li><strong>Gates Millennium</strong> - For minority students, full ride</li>
                <li><strong>Dell Scholars</strong> - For students with financial need</li>
                <li><strong>Horatio Alger</strong> - Overcoming adversity</li>
            </ul>
            
            <h4>Talent-Based Scholarships</h4>
            <ul>
                <li><strong>Athletic scholarships</strong> - NCAA Division I, II, III</li>
                <li><strong>Music scholarships</strong> - Instrumental, vocal</li>
                <li><strong>Art scholarships</strong> - Visual arts, design</li>
                <li><strong>Theater scholarships</strong> - Acting, technical theater</li>
                <li><strong>Dance scholarships</strong> - Various dance styles</li>
            </ul>
            
            <h4>Identity-Based Scholarships</h4>
            <ul>
                <li><strong>UNCF scholarships</strong> - African American students</li>
                <li><strong>HSF scholarships</strong> - Hispanic students</li>
                <li><strong>APIASF scholarships</strong> - Asian Pacific Islander</li>
                <li><strong>Point Foundation</strong> - LGBTQ+ students</li>
                <li><strong>Women's scholarships</strong> - Various fields of study</li>
            </ul>
            
            <h4>Career-Specific Scholarships</h4>
            <ul>
                <li><strong>STEM scholarships</strong> - Science, tech, engineering, math</li>
                <li><strong>Healthcare scholarships</strong> - Nursing, pre-med, allied health</li>
                <li><strong>Teaching scholarships</strong> - Education majors</li>
                <li><strong>Business scholarships</strong> - Business, finance, economics</li>
                <li><strong>Environmental scholarships</strong> - Conservation, sustainability</li>
            </ul>
            
            <h3>💡 Scholarship Application Tips</h3>
            
            <h4>Stand Out from the Crowd</h4>
            <ul>
                <li><strong>Be specific</strong> - Use numbers and examples in essays</li>
                <li><strong>Show, don't tell</strong> - Demonstrate qualities through stories</li>
                <li><strong>Be authentic</strong> - Don't write what you think they want to hear</li>
                <li><strong>Follow directions</strong> - Read all instructions carefully</li>
                <li><strong>Proofread everything</strong> - Typos can eliminate you</li>
            </ul>
            
            <h4>Avoid Common Mistakes</h4>
            <ul>
                <li><strong>One-size-fits-all essays</strong> - Customize for each scholarship</li>
                <li><strong>Missing deadlines</strong> - No exceptions, ever</li>
                <li><strong>Incomplete applications</strong> - Double-check all requirements</li>
                <li><strong>Poor grammar/spelling</strong> - Use spell check and grammar tools</li>
                <li><strong>Not following instructions</strong> - Page limits, formatting, etc.</li>
            </ul>
            
            <h4>Maximize Your Chances</h4>
            <ul>
                <li><strong>Apply for everything</strong> - Even small scholarships add up</li>
                <li><strong>Apply locally</strong> - Less competition than national awards</li>
                <li><strong>Apply early</strong> - Some scholarships give priority to early applicants</li>
                <li><strong>Apply annually</strong> - Many scholarships can be renewed</li>
                <li><strong>Apply for weird scholarships</strong> - Less competition, fun stories</li>
            </ul>
            
            <h3>🚫 Scholarship Scams to Avoid</h3>
            
            <h4>Red Flags</h4>
            <ul>
                <li><strong>Application fees</strong> - Legitimate scholarships don't charge to apply</li>
                <li><strong>Guaranteed awards</strong> - No scholarship is guaranteed</li>
                <li><strong>"You've won!" notifications</strong> - Unsolicited award notifications</li>
                <li><strong>Requests for personal info</strong> - Social security numbers, bank info</li>
                <li><strong>Pressure tactics</strong> - "Apply now or lose your spot"</li>
            </ul>
            
            <h4>How to Verify Legitimacy</h4>
                <ul>
                    <li><strong>Check with school counselor</strong> - They know legitimate scholarships</li>
                    <li><strong>Research the organization</strong> - Look for website, contact info</li>
                    <li><strong>Never pay application fees</strong> - Real scholarships are free</li>
                    <li><strong>Use reputable databases</strong> - Stick to well-known scholarship sites</li>
                    <li><strong>Trust your instincts</strong> - If it seems too good to be true, it probably is</li>
                </ul>
            
            <h3>📊 Scholarship Success Stories</h3>
            
            <h4>Real Examples</h4>
            <ul>
                <li><strong>Student A:</strong> Applied for 50 scholarships, won 12 totaling $45,000</li>
                <li><strong>Student B:</strong> Focused on local scholarships, won $15,000</li>
                <li><strong>Student C:</strong> Won full ride through combination of merit and need-based aid</li>
                <li><strong>Student D:</strong> Applied for weird scholarships, won $8,000 in unusual awards</li>
            </ul>
            
            <h4>What Worked for Them</h4>
            <ul>
                <li><strong>Started early</strong> - Began researching in sophomore year</li>
                <li><strong>Applied consistently</strong> - Treated it like a part-time job</li>
                <li><strong>Wrote compelling essays</strong> - Told authentic stories</li>
                <li><strong>Followed directions</strong> - Met all requirements perfectly</li>
                <li><strong>Applied broadly</strong> - Didn't limit themselves</li>
            </ul>
            
            <h3>🏆 The Bottom Line</h3>
            <p>Scholarships are essentially free money for college, but they require work and strategy. Start early, apply consistently, and don't get discouraged by rejections. Every scholarship you win is money you don't have to borrow or earn.</p>
            
            <p><strong>Remember:</strong> The scholarship search is a marathon, not a sprint. Stay organized, be persistent, and celebrate every win - even the small ones!</p>
        `
    }
};

// Teen Money Tips functionality
const financialTips = [
    "Save 10% of everything you get: Whether it's allowance, birthday money, or job earnings - put 10% away before spending anything!",
    "The 50/30/20 rule: 50% for needs (food, transport), 30% for wants (games, clothes), 20% for savings.",
    "Wait 24 hours before buying something expensive. If you still want it tomorrow, it's probably worth it.",
    "Pack your lunch instead of buying school lunch. You can save $20-30 per week!",
    "Look for student discounts everywhere - movies, restaurants, apps, and clothes stores often have them.",
    "Sell stuff you don't use anymore: old games, clothes, or electronics can make you quick cash.",
    "Start a small business: mow lawns, babysit, or walk dogs in your neighborhood.",
    "Use cash for fun spending. When the cash is gone, you're done spending for the week.",
    "Compare prices before buying. Check online and at least 2 stores before making big purchases.",
    "Put your savings in a separate bank account so you're not tempted to spend it.",
    "Learn to cook! Making meals at home is way cheaper than eating out or ordering delivery.",
    "Track your spending for one week. You'll be surprised where your money really goes!"
];

let currentTipIndex = 0;

// Tip rotation
function nextTip() {
    currentTipIndex = (currentTipIndex + 1) % financialTips.length;
    const featuredArticle = document.querySelector('.enhanced-card p');
    if (featuredArticle) {
        featuredArticle.textContent = financialTips[currentTipIndex];
    }
}
// Blog functionality
function openArticle(articleId) {
    const article = blogArticles[articleId];
    if (!article) {
        return;
    }
    
    const modal = document.getElementById('articleModal');
    const titleElement = document.getElementById('articleTitle');
    const contentElement = document.getElementById('articleContent');
    
    if (modal && titleElement && contentElement) {
        titleElement.textContent = article.title;
        contentElement.innerHTML = article.content;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeArticle() {
    const modal = document.getElementById('articleModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Blog search functionality
function initializeBlogSearch() {
    const searchInput = document.getElementById('blogSearch');
    const categorySelect = document.getElementById('blogCategory');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterArticles);
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', filterArticles);
    }
}

function filterArticles() {
    const searchTerm = document.getElementById('blogSearch').value.toLowerCase();
    const category = document.getElementById('blogCategory').value;
    
    const articles = document.querySelectorAll('article');
    
    articles.forEach(article => {
        const title = article.querySelector('h3').textContent.toLowerCase();
        const description = article.querySelector('p').textContent.toLowerCase();
        const categoryBadge = article.querySelector('span[class*="bg-"]');
        const articleCategory = categoryBadge ? categoryBadge.textContent.toLowerCase() : '';
        
        const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = !category || articleCategory.includes(category.toLowerCase());
        
        if (matchesSearch && matchesCategory) {
            article.style.display = 'block';
        } else {
            article.style.display = 'none';
        }
    });
}

// Teen-focused calculators
function calculateSavingsTime() {
    const goalAmount = parseFloat(document.getElementById('savingsGoal').value);
    const resultElement = document.getElementById('savingsResult');
    if (goalAmount && resultElement) {
        const weeklySavings = goalAmount / 52; // Save over 1 year
        resultElement.innerHTML = 
            `<strong>Save ${formatCurrency(weeklySavings)} per week</strong><br>
             Or ${formatCurrency(weeklySavings/7)} per day to reach your goal in 1 year`;
    }
}

function calculateWeeklySavings() {
    const allowance = parseFloat(document.getElementById('weeklyAllowance').value);
    const resultElement = document.getElementById('weeklyResult');
    if (allowance && resultElement) {
        const save10 = allowance * 0.1;
        const save20 = allowance * 0.2;
        const save50 = allowance * 0.5;
        
        resultElement.innerHTML = 
            `<strong>Savings Options:</strong><br>
             10%: ${formatCurrency(save10)} per week<br>
             20%: ${formatCurrency(save20)} per week<br>
             50%: ${formatCurrency(save50)} per week`;
    }
}

function calculateJobEarnings() {
    const hours = parseFloat(document.getElementById('jobHours').value);
    const resultElement = document.getElementById('jobResult');
    if (hours && resultElement) {
        const minWage = 15; // Federal minimum wage for teens
        const weeklyEarnings = hours * minWage;
        const monthlyEarnings = weeklyEarnings * 4.33; // Average weeks per month
        
        resultElement.innerHTML = 
            `<strong>At $15/hour:</strong><br>
             Weekly: ${formatCurrency(weeklyEarnings)}<br>
             Monthly: ${formatCurrency(monthlyEarnings)}<br>
             Yearly: ${formatCurrency(monthlyEarnings * 12)}`;
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
