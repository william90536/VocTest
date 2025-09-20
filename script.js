let vocList = confusing;
let exclude = [];
let answer;
let q;
let a;
let flag = false;
let totalQuestions = 0;
let currentQuestions = 0;
let point = 0;
let countdownClock = 0;
let time = 0;
let timerID = null;
let wrongAnswers = [];

function start() {
    vocList = [];
    wrongAnswers = [];
    let selectedLists = $('#voc-select').val();
    selectedLists.forEach(function(name) {
        vocList = vocList.concat(window[name]);
    });

    if (vocList.length == 0) {
        alert('請選擇單字庫');
        return;
    }

    let input = parseInt($('#question-count').val(), 10) || 10;
    if (isNaN(input) || input < 1) {
        input = 10;
    }
    totalQuestions = Math.min(input, vocList.length);
    currentQuestions = 0;
    exclude = [];
    point = 0;

    if ($('#time').val() != '') {
        countdownClock = parseInt($('#time').val(), 10);
    }
    $('#start-box').fadeOut(800, function() {
        $('#countdown-box').show();
        startCountdown(function() {
            $('#countdown-box').hide();
            $('#quiz-box').show();
            question();
        });
    });
}


function question() {
    if (currentQuestions >= totalQuestions) {
        $('#quiz-box').fadeOut(500, function() {
            $('#score-box').fadeIn();
            let score = parseFloat((point*100/totalQuestions).toFixed(2));
            animateResult(score);
        });
        return;
    }

    $('#a, #b, #c, #d').removeClass('red').removeClass('green').addClass('blue');
    flag = false;

    let rand = Math.random();
    if (rand < 0.5) {
        q = 'en';
        a = 'zh';
    } else {
        q = 'zh';
        a = 'en';
    }
    let opt = randomVoc(exclude);
    $('#question').text(answer[q]);

    $('#a').text(opt[0][a]);
    $('#b').text(opt[1][a]);
    $('#c').text(opt[2][a]);
    $('#d').text(opt[3][a]);

    currentQuestions++;
    $('#count').text('第'+ currentQuestions + '/' + totalQuestions + '題');

    if (countdownClock != '') {
        time = countdownClock;
        $('#timer').text(time + 's');
        timeBar();

        if (timerID) {
            clearTimeout(timerID);
        }
        timerID = setTimeout(countdown, 1000);
    }
}

function randomVoc(exclude) {
    let include = vocList.filter(v => !exclude.includes(v));
    let rand = Math.floor(Math.random() * include.length);
    answer = include[rand];
    exclude.push(answer);

    let others = vocList.filter(v => v != answer);
    shuffle(others);
    let wrongs = others.slice(0, 3);

    let options = [...wrongs,
        answer];
    shuffle(options);

    return options;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i],
            array[j]] = [array[j],
            array[i]];
    }
}

function check() {
    if (!flag) {
        if ($(this).text() != answer.en && $(this).text() != answer.zh) {
            $(this).removeClass('blue');
            $(this).addClass('red');
            flash('flash-red');
            clearTimeout(timerID);

            wrongAnswers.push({
                question: answer[q],
                options: [$('#a').text(), $('#b').text(), $('#c').text(), $('#d').text()],
                correct: answer[a],
                chosen: $(this).text()
            });
        } else {
            flash('flash-green');
            clearTimeout(timerID);
            point++;
        }

        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue');
                $(this).addClass('green');
            }
        });

        setTimeout(function() {
            question();
        },
            1000);
    }

    flag = true;
}

function countdown() {
    time--;
    $('#timer').text(time + 's');

    if (time == 0) {
        flag = true;
        $('button').each(function() {
            if ($(this).text() == answer.en || $(this).text() === answer.zh) {
                $(this).removeClass('blue');
                $(this).addClass('green');
            }
        });

        wrongAnswers.push({
            question: answer[q],
            options: [$('#a').text(),
                $('#b').text(),
                $('#c').text(),
                $('#d').text()],
            correct: answer[a],
            chosen: "未作答（超時）"
        });

        flash('flash-red');

        setTimeout(question,
            1000);
    } else {
        timerID = setTimeout(countdown, 1000);
    }
}


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

function timeBar() {
    let bar = $('#time-bar .bar');

    let timeouts = bar.data('timeouts') || [];
    timeouts.forEach(id => clearTimeout(id));
    bar.data('timeouts', []);

    bar.css({
        transition: 'none',
        width: '95%',
        backgroundColor: '#28a745'
    });

    bar[0].offsetHeight;

    bar.css({
        transition: `width ${countdownClock}s linear, background-color 0.7s linear`,
        width: '0%'
    });

    let warning70 = setTimeout(() => {
        bar.css('background-color', '#ffc107');
    }, countdownClock * 0.3 * 1000);

    let warning30 = setTimeout(() => {
        bar.css('background-color', '#dc3545');
    }, countdownClock * 0.7 * 1000);

    bar.data('timeouts', [warning70, warning30]);
}

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
    },
        20);

    let circle = document.querySelector('.circle .progress');
    let r = 80;
    let circumference = 2 * Math.PI * r;



    circle.style.transition = 'none';
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;


    circle.getBoundingClientRect();

    let offset = circumference * (1 - finalScore / 100);

    circle.style.transition = 'stroke-dashoffset 1s ease-out';
    circle.style.strokeDashoffset = offset;
}

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
        reviewHtml = "<p>🎉 恭喜，全對！</p>";
    } else {
        wrongAnswers.forEach((item, index) => {
            reviewHtml += `<div class="wrong-item">
            <p><strong>${index + 1}.</strong> ${item.question}</p>
            <p>${item.options.join("<br>")}</p>
            <p style="color:green;">正確答案：${item.correct}</p>
            <p style="color:red;">你的答案：${item.chosen}</p>
            </div>`;
        });
    }
    $('#wrong-review').html(reviewHtml);
});

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