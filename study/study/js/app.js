// ===================== 主应用逻辑 =====================
// 依赖：utils.js, templates.js 中定义的全局函数和变量

(function(){
    // -------- 状态变量 --------
    let currentUser = null;
    let checkedIn = false;
    let currentProblems = [];
    let todayStr = getTodayString();
    let submitBtn, statusBadge, problemsContainer, dateDisplay;

    // -------- 登录状态检测 --------
    async function fetchLoginStatus() {
        try {
            const res = await fetch('/api/user-status');
            const data = await res.json();
            if (data.loggedIn && data.username) {
                currentUser = data.username;
            } else {
                currentUser = null;
            }
        } catch (e) {
            currentUser = null;
        }
        updateLoginUI();
    }

    function updateLoginUI() {
        if (!statusBadge) return;
        if (!currentUser) {
            statusBadge.textContent = '🔐 请先登录后再打卡';
            statusBadge.className = 'status-message';
        } else {
            if (checkedIn) {
                statusBadge.textContent = '✅ 今日已打卡';
                statusBadge.className = 'status-message checked-in';
            } else {
                statusBadge.textContent = '📅 今日未打卡';
                statusBadge.className = 'status-message';
            }
        }
    }

    // -------- 打卡存储 (localStorage) --------
    function loadCheckInStatus() {
        const stored = localStorage.getItem('integral_checkin_date');
        if(stored === todayStr) {
            checkedIn = true;
        } else {
            checkedIn = false;
        }
    }

    function setCheckedIn() {
        localStorage.setItem('integral_checkin_date', todayStr);
        checkedIn = true;
        updateUIBasedOnCheckin();
    }

    // -------- UI 更新（根据打卡状态） --------
    function updateUIBasedOnCheckin() {
        statusBadge.textContent = checkedIn ? '✅ 今日已打卡' : (currentUser ? '📅 今日未打卡' : '🔐 请先登录后再打卡');
        statusBadge.className = `status-message ${checkedIn ? 'checked-in' : ''}`;
        if(submitBtn) submitBtn.disabled = checkedIn;

        if(!currentProblems) return;
        currentProblems.forEach(prob => {
            const cardDom = prob._card;
            const inputEl = prob._input;
            const correctDiv = prob._correctDiv;
            const revealBtnDom = prob._revealBtn;

            if(checkedIn) {
                if(inputEl) inputEl.disabled = true;
                if(correctDiv) {
                    renderLatex(prob.displayTex + ' + C', correctDiv);
                    correctDiv.style.display = 'block';
                }
                if(revealBtnDom) {
                    revealBtnDom.disabled = true;
                    revealBtnDom.classList.add('viewed');
                }
                if(prob._card) prob._card.classList.remove('wrong-highlight','correct-highlight');
                if(prob._icon) {
                    prob._icon.textContent = '✓';
                    prob._icon.className = 'result-icon';
                }
            } else {
                if(prob.viewedAnswer){
                    if(inputEl) inputEl.disabled = true;
                    if(correctDiv) correctDiv.style.display = 'block';
                    if(revealBtnDom) revealBtnDom.classList.add('viewed');
                } else {
                    if(inputEl && !checkedIn) inputEl.disabled = false;
                    if(correctDiv && !prob.viewedAnswer) correctDiv.style.display = 'none';
                }
            }
        });
    }

    // -------- 渲染题目 --------
    function renderProblems() {
        problemsContainer.innerHTML = '';
        currentProblems.forEach((prob, idx) => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.dataset.id = prob.id;

            // header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'problem-header';
            const numSpan = document.createElement('span');
            numSpan.className = 'problem-number';
            numSpan.textContent = `第 ${idx+1} 题`;
            const revealBtn = document.createElement('button');
            revealBtn.className = `reveal-btn ${prob.viewedAnswer ? 'viewed' : ''}`;
            revealBtn.textContent = prob.viewedAnswer ? '已查看答案' : '🔍 显示答案';
            revealBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if(checkedIn || prob.viewedAnswer) return;
                if(confirm('⚠️ 查看答案后本题将无法计入“全对打卡”，确定继续吗？')) {
                    prob.viewedAnswer = true;
                    prob.userAnswer = '';
                    prob.lastResult = 'wrong';
                    if(prob._input) {
                        prob._input.disabled = true;
                        prob._input.value = '';
                    }
                    if(prob._correctDiv) {
                        renderLatex(prob.displayTex + ' + C', prob._correctDiv);
                        prob._correctDiv.style.display = 'block';
                    }
                    revealBtn.textContent = '已查看答案';
                    revealBtn.classList.add('viewed');
                    if(prob._icon) {
                        prob._icon.textContent = '✗';
                        prob._icon.classList.add('wrong');
                    }
                    card.classList.add('wrong-highlight');
                }
            });
            headerDiv.appendChild(numSpan);
            headerDiv.appendChild(revealBtn);

            // 积分显示
            const integralDiv = document.createElement('div');
            integralDiv.className = 'integral-display';
            const fTex = toTexSafe(prob.fStr);
            const integralTex = fTex ? `\\int \\left( ${fTex} \\right) \\mathrm{d}x` : `∫ (${prob.fStr}) dx`;
            renderLatex(integralTex, integralDiv);

            // 答案区
            const answerArea = document.createElement('div');
            answerArea.className = 'answer-area';
            const inputRow = document.createElement('div');
            inputRow.className = 'answer-input-row';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'answer-input';
            input.placeholder = '例如: (1/3)*x^3 或 sin(2*x)';
            input.value = prob.userAnswer || '';
            input.disabled = checkedIn || prob.viewedAnswer;
            const iconSpan = document.createElement('span');
            iconSpan.className = 'result-icon';
            inputRow.appendChild(input);
            inputRow.appendChild(iconSpan);
            const errorMsgDiv = document.createElement('div');
            errorMsgDiv.className = 'error-message';
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-latex';
            answerArea.appendChild(inputRow);
            answerArea.appendChild(errorMsgDiv);
            answerArea.appendChild(previewDiv);

            const correctDivAnswer = document.createElement('div');
            correctDivAnswer.className = 'correct-answer-display';
            correctDivAnswer.style.display = (checkedIn || prob.viewedAnswer) ? 'block' : 'none';
            if(checkedIn || prob.viewedAnswer) renderLatex(prob.displayTex + ' + C', correctDivAnswer);

            card.appendChild(headerDiv);
            card.appendChild(integralDiv);
            card.appendChild(answerArea);
            card.appendChild(correctDivAnswer);
            problemsContainer.appendChild(card);

            // 绑定DOM引用
            prob._card = card;
            prob._input = input;
            prob._icon = iconSpan;
            prob._correctDiv = correctDivAnswer;
            prob._revealBtn = revealBtn;
            prob._errorMsg = errorMsgDiv;
            prob._previewDiv = previewDiv;

            // 输入实时监听
            input.addEventListener('input', () => {
                prob.userAnswer = input.value;
                if(prob.lastResult) {
                    prob.lastResult = null;
                    card.classList.remove('wrong-highlight','correct-highlight');
                    iconSpan.textContent = '';
                    iconSpan.className = 'result-icon';
                }
                const validation = validateExpression(input.value);
                if(!validation.valid && input.value.trim() !== '') {
                    input.classList.add('input-error');
                    errorMsgDiv.textContent = '❌ 表达式语法错误';
                    errorMsgDiv.style.display = 'block';
                    previewDiv.innerHTML = '';
                } else {
                    input.classList.remove('input-error');
                    errorMsgDiv.style.display = 'none';
                    if(input.value.trim() !== '') {
                        const previewTex = toTexSafe(preprocessImplicitMultiplication(input.value));
                        if(previewTex) renderLatex(previewTex, previewDiv);
                        else previewDiv.textContent = '(预览)';
                    } else previewDiv.innerHTML = '';
                }
            });
            if(prob.userAnswer) input.dispatchEvent(new Event('input'));
        });
        updateUIBasedOnCheckin();
    }

    // -------- 提交全部 --------
    async function handleSubmitAll() {
        if(checkedIn) {
            alert('今日已完成打卡，无法再次提交。明日再来挑战吧！');
            return;
        }
        let allCorrect = true;
        let hasViewed = false;
        for(const prob of currentProblems) {
            if(prob.viewedAnswer) {
                hasViewed = true;
                allCorrect = false;
                if(prob._icon) {
                    prob._icon.textContent = '✗';
                    prob._icon.classList.add('wrong');
                }
                prob._card.classList.add('wrong-highlight');
                continue;
            }
            const userAns = prob._input.value.trim();
            prob.userAnswer = userAns;
            const isCorrect = checkAnswer(userAns, prob.F_str);
            prob.lastResult = isCorrect ? 'correct' : 'wrong';
            if(prob._icon) {
                prob._icon.textContent = isCorrect ? '✓' : '✗';
                prob._icon.className = `result-icon ${!isCorrect ? 'wrong' : ''}`;
            }
            prob._card.classList.remove('wrong-highlight','correct-highlight');
            prob._card.classList.add(isCorrect ? 'correct-highlight' : 'wrong-highlight');
            if(!isCorrect) allCorrect = false;
        }

        if (allCorrect && !hasViewed) {
            if (!currentUser) {
                alert('请先登录后再打卡积分！');
                return;
            }
            try {
                const checkinRes = await fetch('/api/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser })
                });
                const checkinData = await checkinRes.json();
                if (checkinRes.ok && checkinData.success) {
                    setCheckedIn();
                    for(const prob of currentProblems) {
                        if(prob._correctDiv) {
                            renderLatex(prob.displayTex + ' + C', prob._correctDiv);
                            prob._correctDiv.style.display = 'block';
                        }
                        if(prob._input) prob._input.disabled = true;
                        if(prob._revealBtn) {
                            prob._revealBtn.disabled = true;
                            prob._revealBtn.classList.add('viewed');
                        }
                    }
                    submitBtn.disabled = true;
                    alert(`🎉 恭喜！全部5道积分题解答正确！今日打卡成功，获得10积分！当前总积分：${checkinData.totalScore}`);
                } else {
                    alert('打卡失败：' + (checkinData.error || '请稍后重试'));
                    return;
                }
            } catch (err) {
                alert('网络错误，打卡失败');
                return;
            }
        } else if (!allCorrect) {
            const firstWrong = document.querySelector('.problem-card.wrong-highlight');
            if (firstWrong) firstWrong.scrollIntoView({ behavior: 'smooth', block: 'center' });
            alert('❌ 部分答案不正确，请根据提示修改后重试。');
        } else if (hasViewed && allCorrect) {
            alert('📖 已查看过答案，无法打卡。明天可关闭答案后独立完成。');
        }
    }

    // -------- 虚拟数学键盘 --------
    function initKeypad() {
        const container = document.getElementById('keypad-container');
        if(!container) return;
        let currentInput = null;

        document.addEventListener('focusin', (e) => {
            if(e.target.classList.contains('answer-input')) {
                currentInput = e.target;
            }
        });

        function insertText(text) {
            if(!currentInput || currentInput.disabled) return;
            const start = currentInput.selectionStart;
            const end = currentInput.selectionEnd;
            const val = currentInput.value;
            currentInput.value = val.substring(0, start) + text + val.substring(end);
            currentInput.setSelectionRange(start + text.length, start + text.length);
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        function backspace() {
            if(!currentInput || currentInput.disabled) return;
            const start = currentInput.selectionStart, end = currentInput.selectionEnd;
            if(start !== end) {
                currentInput.value = currentInput.value.substring(0, start) + currentInput.value.substring(end);
                currentInput.setSelectionRange(start, start);
            } else if(start > 0) {
                currentInput.value = currentInput.value.substring(0, start-1) + currentInput.value.substring(start);
                currentInput.setSelectionRange(start-1, start-1);
            }
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const panel = document.createElement('div');
        panel.className = 'keypad-panel';
        panel.innerHTML = '<div class="keypad-title">🧮 虚拟数学键盘</div>';
        const grid = document.createElement('div');
        grid.className = 'keypad-grid';

        const rows = [
            ['x','1','2','3','4','5','6','7','8','9','0'],
            ['+','-','*','/','^','(',')'],
            ['sin(','cos(','tan(','arcsin(','arccos(','arctan(','log('],
            ['_','C','=','sqrt(']
        ];
        rows.forEach(row => {
            row.forEach(sym => {
                const btn = document.createElement('button');
                btn.className = 'keypad-btn' + (sym.length>1 && sym.includes('(') ? ' func' : '');
                btn.textContent = sym;
                btn.addEventListener('click', (e) => { e.preventDefault(); insertText(sym); });
                grid.appendChild(btn);
            });
        });

        const backBtn = document.createElement('button');
        backBtn.textContent = '⌫ 退格';
        backBtn.className = 'keypad-btn wide';
        backBtn.addEventListener('click', backspace);
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ 清空';
        clearBtn.className = 'keypad-btn wide';
        clearBtn.addEventListener('click', () => {
            if(currentInput && !currentInput.disabled) {
                currentInput.value = '';
                currentInput.dispatchEvent(new Event('input'));
                currentInput.focus();
            }
        });
        grid.appendChild(backBtn);
        grid.appendChild(clearBtn);
        panel.appendChild(grid);
        container.appendChild(panel);
    }

    // -------- 启动 --------
    async function initApp() {
        dateDisplay = document.getElementById('date-display');
        statusBadge = document.getElementById('status-badge');
        problemsContainer = document.getElementById('problems-container');
        submitBtn = document.getElementById('submit-all-btn');

        if(dateDisplay) dateDisplay.textContent = todayStr;

        await fetchLoginStatus();   // 必须先获取登录状态，再加载打卡状态
        loadCheckInStatus();
        currentProblems = generateProblems(todayStr);
        renderProblems();
        submitBtn.addEventListener('click', handleSubmitAll);
        initKeypad();
    }

    window.addEventListener('DOMContentLoaded', initApp);
})();