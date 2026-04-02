let vocList = [];//單字出題範圍
let exclude = [];//已抽過單字
let answer;//正確答案
let q, a;//q: 問題語言, a: 答案語言
let flag = false;//是否已作答
let totalQuestions = 0;//總題數
let currentQuestions = 0;//當前題號
let point = 0;//答對題數
let countdownClock = 0;//設定秒數限制
let time = 0;//剩餘秒數
let timerID = null;//setTimeout ID
let wrongAnswers = [];//錯題

function start() {
    vocList = [];
    wrongAnswers = [];
    
    // 獲取使用者選取的單字庫名稱
    let selectedLists = $('#voc-select').val();
    selectedLists.forEach(function(name) {
        // 從全域變數 window[name] 中合併單字資料
        vocList = vocList.concat(window[name]);
    });

    if (vocList.length == 0) {
        alert('請選擇單字庫');
        return;
    }

    // 設定總題數（不可超過單字庫總數）
    let input = parseInt($('#question-count').val(), 10) || 10;
    if (isNaN(input) || input < 1) { input = 10; }
    totalQuestions = Math.min(input, vocList.length);
    currentQuestions = 0;
    exclude = [];
    point = 0;

    // 取得計時設定
    if ($('#time').val() != '') {
        countdownClock = parseInt($('#time').val(), 10);
    }

    // 切換 UI 介面：隱藏開始盒，顯示倒數動畫
    $('#start-box').fadeOut(800, function() {
        $('#countdown-box').show();
        startCountdown(function() {
            $('#countdown-box').hide();
            $('#quiz-box').show();
            question(); // 正式進入第一題
        });
    });
}

/**
 * 出題函數
 */
function question() {
    // 檢查是否已達到總題數
    if (currentQuestions >= totalQuestions) {
        $('#quiz-box').fadeOut(500, function() {
            $('#score-box').fadeIn();
            let score = parseFloat((point * 100 / totalQuestions).toFixed(2));
            animateResult(score); // 顯示分數動畫
        });
        return;
    }

    // 初始化按鈕顏色與狀態
    $('#a, #b, #c, #d').removeClass('red').removeClass('green').addClass('blue');
    flag = false;

    // 隨機決定題型：中選英 (50%) 或 英選中 (50%)
    let rand = Math.random();
    if (rand < 0.5) {
        q = 'en'; a = 'zh';
    } else {
        q = 'zh'; a = 'en';
    }

    // 取得一組包含 1 個正確答案與 3 個干擾項的選項陣列
    let opt = randomVoc(exclude);
    $('#question').text(answer[q]); // 顯示題目

    // 顯示四個選項
    $('#a').text(opt[0][a]);
    $('#b').text(opt[1][a]);
    $('#c').text(opt[2][a]);
    $('#d').text(opt[3][a]);

    currentQuestions++;
    $('#count').text('第' + currentQuestions + '/' + totalQuestions + '題');

    // 如果有設定限時，啟動計時器與進度條
    if (countdownClock != '') {
        time = countdownClock;
        $('#timer').text(time + 's');
        timeBar(); // 動態進度條

        if (timerID) { clearTimeout(timerID); }
        timerID = setTimeout(countdown, 1000);
    }
}

/**
 * 抽取隨機單字與生成干擾項
 */
function randomVoc(exclude) {
    // 過濾掉已經出現過的單字
    let include = vocList.filter(v => !exclude.includes(v));
    let rand = Math.floor(Math.random() * include.length);
    answer = include[rand]; // 抽中作為正確答案
    exclude.push(answer);

    // 從所有單字中選出 3 個不同於答案的單字作為干擾項
    let others = vocList.filter(v => v != answer);
    shuffle(others);
    let wrongs = others.slice(0, 3);

    let options = [...wrongs, answer];
    shuffle(options); // 洗牌選項順序

    return options;
}

/**
 * 陣列隨機排序（洗牌演算法）
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * 檢查使用者點選的答案
 */
function check() {
    if (!flag) { // 確保未進入下一題前只能點一次
        let chosenText = $(this).text();
        
        // 判斷是否答錯
        if (chosenText != answer.en && chosenText != answer.zh) {
            $(this).removeClass('blue').addClass('red');
            flash('flash-red'); // 螢幕閃紅光
            clearTimeout(timerID);

            // 紀錄錯題資訊
            wrongAnswers.push({
                question: answer[q],
                options: [$('#a').text(), $('#b').text(), $('#c').text(), $('#d').text()],
                correct: answer[a],
                chosen: chosenText
            });
        } else {
            // 答對
            flash('flash-green'); // 螢幕閃綠光
            clearTimeout(timerID);
            point++;
        }

        // 無論對錯，都要標示出「正確答案」的按鈕顏色
        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue').addClass('green');
            }
        });

        // 延遲一秒後進入下一題
        setTimeout(function() {
            question();
        }, 1000);
    }
    flag = true;
}

/**
 * 倒數計時邏輯
 */
function countdown() {
    time--;
    $('#timer').text(time + 's');

    if (time <= 0) {
        flag = true; // 時間到，鎖定點擊
        // 顯示正確答案
        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue').addClass('green');
            }
        });

        // 紀錄為超時答錯
        wrongAnswers.push({
            question: answer[q],
            options: [$('#a').text(), $('#b').text(), $('#c').text(), $('#d').text()],
            correct: answer[a],
            chosen: "未作答（超時）"
        });

        flash('flash-red');
        setTimeout(question, 1000);
    } else {
        timerID = setTimeout(countdown, 1000);
    }
}

/**
 * 螢幕閃爍特效
 */
function flash(flashColor) {
    $('#quiz-box').addClass(flashColor);
    setTimeout(function() {
        $('#quiz-box').removeClass(flashColor);
    }, 500);
}

/**
 * 重新開始
 */
function restart() {
    $('#wrong-box').fadeOut(500, function() {
        $('#start-box').fadeIn();
    });
}

/**
 * 進度條動畫與變色控制
 */
function timeBar() {
    let bar = $('#time-bar .bar');

    // 清除舊的計時任務
    let timeouts = bar.data('timeouts') || [];
    timeouts.forEach(id => clearTimeout(id));
    bar.data('timeouts', []);

    // 重設進度條狀態
    bar.css({
        transition: 'none',
        width: '95%',
        backgroundColor: '#28a745'
    });

    bar[0].offsetHeight; // 強制重繪

    // 開始 CSS 寬度縮減動畫
    bar.css({
        transition: `width ${countdownClock}s linear, background-color 0.7s linear`,
        width: '0%'
    });

    // 設定變色門檻：剩餘 70% 變黃，剩餘 30% 變紅
    let warning70 = setTimeout(() => {
        bar.css('background-color', '#ffc107');
    }, countdownClock * 0.3 * 1000);

    let warning30 = setTimeout(() => {
        bar.css('background-color', '#dc3545');
    }, countdownClock * 0.7 * 1000);

    bar.data('timeouts', [warning70, warning30]);
}

/**
 * 分數數字跳動與圓形進度條動畫
 */
function animateResult(finalScore) {
    let current = 0;
    let step = finalScore / 50;
    let interval = setInterval(() => {
        current += step;
        if (current >= finalScore) {
            current = finalScore;
            clearInterval(interval);
        }
        $('#score').text(parseFloat(current.toFixed(2)) + '%');
    }, 20);

    // SVG 圓形進度條邏輯
    let circle = document.querySelector('.circle .progress');
    let r = 80;
    let circumference = 2 * Math.PI * r;

    circle.style.transition = 'none';
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    circle.getBoundingClientRect(); // 強制重繪

    let offset = circumference * (1 - finalScore / 100);
    circle.style.transition = 'stroke-dashoffset 1s ease-out';
    circle.style.strokeDashoffset = offset;
}

/**
 * 開始前的 3-2-1-0 倒數動畫
 */
function startCountdown(callback) {
    let steps = ['#3', '#2', '#1', '#0'];
    let i = 0;

    function showStep() {
        steps.forEach(id => $(id).hide());
        if (i < steps.length) {
            $(steps[i]).fadeIn(200).delay(300).fadeOut(200, function() {
                i++;
                showStep();
            });
        } else {
            if (callback) callback();
        }
    }
    showStep();
}

/**
 * 事件監聽綁定
 */
$('#start').click(start);
$('#a, #b, #c, #d').click(check);
$('#restart').click(restart);

// 點擊查看錯題詳情
$('#next').click(function() {
    $('#score-box').fadeOut(500, function() {
        $('#wrong-box').fadeIn();
    });

    let reviewHtml = "";
    if (wrongAnswers.length === 0) {
        reviewHtml = "<p> 全對！真棒！</p>";
    } else {
        wrongAnswers.forEach((item, index) => {
            reviewHtml += `<div class="wrong-item">
                <p><strong>${index + 1}.</strong> 題目：${item.question}</p>
                <p>選項：${item.options.join(" / ")}</p>
                <p style="color:green;">正確答案：${item.correct}</p>
                <p style="color:red;">你的選擇：${item.chosen}</p>
                <hr>
            </div>`;
        });
    }
    $('#wrong-review').html(reviewHtml);
});

/**
 * 按鈕點擊的漣漪特效 (Ripple Effect)
 */
$('button').click(function(e) {
    let button = $(this);
    let ripple = $('<span class="ripple"></span>');

    let offset = button.offset();
    let x = e.pageX - offset.left;
    let y = e.pageY - offset.top;

    ripple.css({
        width: button.width(),
        height: button.width(),
        top: y - button.width() / 2,
        left: x - button.width() / 2
    });

    button.append(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
});
