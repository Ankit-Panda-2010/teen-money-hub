// Teen Money Hub JavaScript

// Data storage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 200; // Default teen allowance

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
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
    
    console.log('Found tabs:', tabBtns.length); // Debug
    console.log('Found tab contents:', tabContents.length); // Debug

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            console.log('Tab clicked:', targetTab); // Debug
            
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
            console.log('Target element:', targetElement); // Debug
            if (targetElement) {
                targetElement.classList.add('active');
                console.log('Added active class to:', targetTab); // Debug
            } else {
                console.error('Target element not found:', targetTab); // Debug
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
    }
};

// Blog functionality
function openArticle(articleId) {
    console.log('Opening article:', articleId); // Debug line
    
    const article = blogArticles[articleId];
    if (!article) {
        console.error('Article not found:', articleId);
        return;
    }
    
    console.log('Article found:', article.title); // Debug line
    
    const modal = document.getElementById('articleModal');
    const titleElement = document.getElementById('articleTitle');
    const contentElement = document.getElementById('articleContent');
    
    console.log('Modal element:', modal); // Debug line
    console.log('Title element:', titleElement); // Debug line
    console.log('Content element:', contentElement); // Debug line
    
    if (modal && titleElement && contentElement) {
        titleElement.textContent = article.title;
        contentElement.innerHTML = article.content;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        console.log('Modal should be visible now'); // Debug line
    } else {
        console.error('Modal elements not found');
    }
}

function closeArticle() {
    const modal = document.getElementById('articleModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Blog search functionality
function initializeBlogSearch() {
    console.log('Initializing blog search...'); // Debug line
    
    const searchInput = document.getElementById('blogSearch');
    const categorySelect = document.getElementById('blogCategory');
    
    console.log('Search input:', searchInput); // Debug line
    console.log('Category select:', categorySelect); // Debug line
    
    if (searchInput) {
        searchInput.addEventListener('input', filterArticles);
        console.log('Search listener added'); // Debug line
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', filterArticles);
        console.log('Category listener added'); // Debug line
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
