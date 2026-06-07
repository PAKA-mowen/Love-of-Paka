// ===================== 积分题目模板与生成器 =====================
// 依赖：randInt (来自 utils.js), seedrandom, math

const integralTemplates = (function (randIntFn) {
    return [
        function (rng) { let a = randIntFn(1,3,rng), b = randIntFn(0,3,rng), n = randIntFn(2,4,rng), n1 = n+1; return { F: `(1/(${a}*${n1}))*(${a}*x+${b})^${n1}` }; },
        function (rng) { let a = randIntFn(1,3,rng), n = randIntFn(2,3,rng), n1 = n+1; return { F: `sin(${a}*x)^${n1}/(${a}*${n1})` }; },
        function (rng) { let a = randIntFn(1,3,rng), n = randIntFn(2,3,rng), n1 = n+1; return { F: `-cos(${a}*x)^${n1}/(${a}*${n1})` }; },
        function (rng) { let a = randIntFn(1,3,rng), n = randIntFn(1,2,rng); if(n===1) return { F: `exp(${a}*x)*(x/${a} - 1/${a}^2)` }; else return { F: `exp(${a}*x)*(x^2/${a} - 2*x/${a}^2 + 2/${a}^3)` }; },
        function (rng) { let a = randIntFn(1,3,rng); return { F: `(sin(${a}*x) - ${a}*x*cos(${a}*x))/${a}^2` }; },
        function (rng) { let a = randIntFn(1,3,rng); return { F: `(cos(${a}*x) + ${a}*x*sin(${a}*x))/${a}^2` }; },
        function (rng) { let a = randIntFn(1,3,rng), b = randIntFn(1,3,rng); return { F: `exp(${a}*x)*(${a}*sin(${b}*x) - ${b}*cos(${b}*x))/(${a}^2+${b}^2)` }; },
        function (rng) { let a = randIntFn(1,3,rng), b = randIntFn(1,3,rng); return { F: `exp(${a}*x)*(${a}*cos(${b}*x) + ${b}*sin(${b}*x))/(${a}^2+${b}^2)` }; },
        function (rng) { let a = randIntFn(1,3,rng), n = randIntFn(1,2,rng); if(n===1) return { F: `x^2/2*log(${a}*x) - x^2/4` }; else return { F: `x^3/3*log(${a}*x) - x^3/9` }; },
        function (rng) { let a = randIntFn(1,3,rng); return { F: `(1/${a})*atan(x/${a})` }; },
        function (rng) { let a = randIntFn(2,4,rng); return { F: `asin(x/${a})` }; },
        function (rng) { let a = randIntFn(1,3,rng), b = randIntFn(0,3,rng); return { F: `(2/(3*${a}))*(${a}*x+${b})^(3/2)` }; },
        function (rng) { let a = randIntFn(1,5,rng); return { F: `sqrt(x^2+${a})` }; },
        function (rng) { let a = randIntFn(1,3,rng), b = randIntFn(1,3,rng); while(a===b) b = randIntFn(1,3,rng); return { F: `-cos((${a}-${b})*x)/(2*(${a}-${b})) - cos((${a}+${b})*x)/(2*(${a}+${b}))` }; },
        function () { return { F: `0.5*x^2*atan(x) - x/2 + 0.5*atan(x)` }; }
    ];
})(randInt);

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function generateProblems(seed) {
    const rng = new Math.seedrandom(seed);
    const templates = integralTemplates;
    const problems = [];
    for(let i = 0; i < 5; i++) {
        const idx = Math.floor(rng() * templates.length);
        const { F } = templates[idx](rng);
        let F_node, f_node, f_simplified;
        try {
            F_node = math.parse(F);
            f_node = math.derivative(F_node, math.parse('x'));
            f_simplified = math.simplify(f_node);
        } catch(e) {
            const a = randInt(1,3,rng), n = randInt(2,4,rng);
            const fallback = `(1/(${a}*${n+1}))*(${a}*x)^${n+1}`;
            F_node = math.parse(fallback);
            f_node = math.derivative(F_node, math.parse('x'));
            f_simplified = math.simplify(f_node);
        }
        let displayTex = '';
        try { displayTex = math.simplify(F_node).toTex(); } catch(e) { displayTex = F_node.toTex(); }
        problems.push({
            id: i,
            F_str: F,
            displayTex: displayTex,
            fStr: f_simplified.toString(),
            viewedAnswer: false,
            userAnswer: '',
            lastResult: null
        });
    }
    return problems;
}