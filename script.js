let vocList = [];//單字出題範圍
let exclude = [];//已當過題目單字
let answer;//正確答案
let q, a;//q:問題語言, a:答案語言
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
    
    let selectedLists = $('#voc-select').val();//選取單字庫
    selectedLists.forEach(function(name) {
        vocList = vocList.concat(window[name]);
    });//合併單字庫

    if (vocList.length == 0) {
        alert('請選擇單字庫');
        return;
    }

    //題數設定
    let input = parseInt($('#question-count').val(), 10) || 10;
    if (isNaN(input) || input < 1) { input = 10; }
    totalQuestions = Math.min(input, vocList.length);
    currentQuestions = 0;
    exclude = [];
    point = 0;

    //計時設定
    if ($('#time').val() != '') {
        countdownClock = parseInt($('#time').val(), 10);
    }

    //倒數動畫
    $('#start-box').fadeOut(800, function() {
        $('#countdown-box').show();
        startCountdown(function() {
            $('#countdown-box').hide();
            $('#quiz-box').show();
            question();
        });
    });
}

//出題
function question() {
    //是否完成測驗
    if (currentQuestions >= totalQuestions) {
        $('#quiz-box').fadeOut(500, function() {
            $('#score-box').fadeIn();
            let score = parseFloat((point * 100 / totalQuestions).toFixed(2));
            animateResult(score);//分數動畫
        });
        return;
    }

    //初始化按鈕
    $('#a, #b, #c, #d').removeClass('red').removeClass('green').addClass('blue');
    flag = false;

    //隨機題型
    let rand = Math.random();
    if (rand < 0.5) {
        q = 'en'; a = 'zh';
    } else {
        q = 'zh'; a = 'en';
    }

    //設定題目與選項
    let opt = randomVoc(exclude);
    $('#question').text(answer[q]);//選定題目

    //顯示選項
    $('#a').text(opt[0][a]);
    $('#b').text(opt[1][a]);
    $('#c').text(opt[2][a]);
    $('#d').text(opt[3][a]);

    currentQuestions++;
    $('#count').text('第' + currentQuestions + '/' + totalQuestions + '題');

    //計時器與時間條
    if (countdownClock != '') {
        time = countdownClock;
        $('#timer').text(time + 's');
        timeBar();

        if (timerID) { clearTimeout(timerID); }
        timerID = setTimeout(countdown, 1000);
    }
}

//設定題目組合
function randomVoc(exclude) {
    //過濾已當過題目單字
    let include = vocList.filter(v => !exclude.includes(v));
    let rand = Math.floor(Math.random() * include.length);
    answer = include[rand];//正確答案
    exclude.push(answer);

    //設定錯誤選項
    let others = vocList.filter(v => v != answer);
    shuffle(others);
    let wrongs = others.slice(0, 3);

    let options = [...wrongs, answer];
    shuffle(options);

    return options;
}

//洗牌
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//檢查玩家作答
function check() {
    if (!flag) {
        let chosenText = $(this).text();
        
        //判斷是否答錯
        if (chosenText != answer.en && chosenText != answer.zh) {
            $(this).removeClass('blue').addClass('red');
            flash('flash-red');
            clearTimeout(timerID);

            //紀錄錯題
            wrongAnswers.push({
                question: answer[q],
                options: [$('#a').text(), $('#b').text(), $('#c').text(), $('#d').text()],
                correct: answer[a],
                chosen: chosenText
            });
        } else {
            flash('flash-green');
            clearTimeout(timerID);
            point++;
        }

        //顯示正確答案
        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue').addClass('green');
            }
        });

        //進入下一題
        setTimeout(function() {
            question();
        }, 1000);
    }
    flag = true;
}

//倒數計時
function countdown() {
    time--;
    $('#timer').text(time + 's');

    //超時
    if (time <= 0) {
        flag = true;
        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue').addClass('green');
            }
        });

        //紀錄超時答錯
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

//閃爍特效
function flash(flashColor) {
    $('#quiz-box').addClass(flashColor);
    setTimeout(function() {
        $('#quiz-box').removeClass(flashColor);
    }, 500);
}

function restart() {
    $('#wrong-box').fadeOut(500, function() {
        $('#start-box').fadeIn();
    });
}

//時間條動畫
function timeBar() {
    let bar = $('#time-bar .bar');

    //清除計時任務
    let timeouts = bar.data('timeouts') || [];
    timeouts.forEach(id => clearTimeout(id));
    bar.data('timeouts', []);

    //重設狀態
    bar.css({
        transition: 'none',
        width: '95%',
        backgroundColor: '#28a745'
    });

    bar[0].offsetHeight;//強制重繪

    bar.css({
        transition: `width ${countdownClock}s linear, background-color 0.7s linear`,
        width: '0%'
    });

    //變色
    let warning70 = setTimeout(() => {
        bar.css('background-color', '#ffc107');
    }, countdownClock * 0.3 * 1000);

    let warning30 = setTimeout(() => {
        bar.css('background-color', '#dc3545');
    }, countdownClock * 0.7 * 1000);

    bar.data('timeouts', [warning70, warning30]);
}

//分數與圓形進度條動畫
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

    let circle = document.querySelector('.circle .progress');
    let r = 80;
    let circumference = 2 * Math.PI * r;

    circle.style.transition = 'none';
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    circle.getBoundingClientRect();//強制重繪

    let offset = circumference * (1 - finalScore / 100);
    circle.style.transition = 'stroke-dashoffset 1s ease-out';
    circle.style.strokeDashoffset = offset;
}

//開始倒數
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

$('#start').click(start);
$('#a, #b, #c, #d').click(check);
$('#restart').click(restart);

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

//按鈕點擊特效
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
