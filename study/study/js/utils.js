// ===================== 工具函数 =====================
// 依赖：math.js（全局 math 对象）, KaTeX

// 隐式乘法预处理：将 "2x" -> "2*x", "xsin(x)" -> "x*sin(x)"
function preprocessImplicitMultiplication(expr) {
    if (!expr || typeof expr !== 'string') return expr;
    let processed = expr.trim();
    processed = processed.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
    processed = processed.replace(/([a-zA-Z)])([a-zA-Z(])/g, '$1*$2');
    processed = processed.replace(/(\))(\d)/g, '$1*$2');
    processed = processed.replace(/(\^[\d]+)([a-zA-Z(])/g, '$1*$2');
    return processed;
}

// 随机整数
function randInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

// 语法校验
function validateExpression(expr) {
    if (!expr || expr.trim() === '') return { valid: true };
    try {
        const processed = preprocessImplicitMultiplication(expr);
        math.parse(processed);
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

// 验证用户答案是否正确（常数差异容差 1e-4）
function checkAnswer(userInput, standardFStr) {
    if (!userInput || userInput.trim() === '') return false;
    try {
        let processedUser = preprocessImplicitMultiplication(userInput);
        processedUser = processedUser.replace(/\bC\b/g, '0');
        const stdNode = math.parse(standardFStr);
        const userNode = math.parse(processedUser);
        const stdCompiled = stdNode.compile();
        const userCompiled = userNode.compile();

        const samples = [];
        for (let i = 0; i <= 20; i++) {
            samples.push(-4 + (8 * i) / 20);
        }

        const diffs = [];
        for (const x of samples) {
            try {
                const yStd = stdCompiled.evaluate({ x });
                const yUser = userCompiled.evaluate({ x });
                if (isFinite(yStd) && isFinite(yUser) && !isNaN(yStd) && !isNaN(yUser)) {
                    diffs.push(yUser - yStd);
                }
            } catch(e) { continue; }
        }
        if (diffs.length < 8) return false;
        const selected = diffs.slice(0, 12);
        const maxDiff = Math.max(...selected);
        const minDiff = Math.min(...selected);
        return (maxDiff - minDiff) < 1e-4;
    } catch(e) {
        console.debug("验证异常", e);
        return false;
    }
}

// LaTeX 转换
function toTexSafe(exprStr) {
    if (!exprStr) return '';
    try {
        const node = math.parse(exprStr);
        return node.toTex();
    } catch(e) { return null; }
}

function beautifyTex(tex) {
    if (!tex) return tex;
    return tex.replace(/(\d)\\cdot\s*([a-zA-Z\\])/g, '$1$2');
}

function renderLatex(tex, element) {
    if (!tex || !element) return;
    try {
        katex.render(beautifyTex(tex), element, { throwOnError: false });
    } catch(e) {
        element.textContent = tex;
    }
}