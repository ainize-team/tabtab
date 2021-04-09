let idx = 0; // 탭 번호
let TAB_ON = false; // 탭 활성화
let TAB_PRESS = false;

const editor = document.getElementsByClassName("editor")[0];
const menu = document.getElementById("menu");
const items = document.getElementsByClassName("item");
const wrap_items = document.getElementsByClassName("wrap-item");

const auto_button = document.getElementsByClassName("rectangle")[0];

const curModel = document.getElementById('model');

const urlParams = new URLSearchParams(window.location.search);
const modelUrl = urlParams.get('modelUrl');
const text = urlParams.get('text');

if (text) {
    document.getElementById('editor').innerText = decodeURIComponent(text);
} else {
    document.getElementById('editor').innerText =
`Ainize is a launchpad for open-source projects.\n\
Programming code is merely a text unless it is allocated with proper computing resources.\n\
Ainize is about bringing Open-source projects to life by turning them into instantly executable services or APIs.\n`;

}
if (modelUrl) {
    const modelName = /[^/]*$/.exec(modelUrl)[0];
    const newOption = document.createElement('option');
    newOption.selected = "selected";
    newOption.value = `custom-${modelName}`;
    newOption.innerHTML = modelName;

    curModel.appendChild(newOption);
    newOption.click();
}

const KEY_CODE = {"TAB" : 9, "UP" : 38, "DOWN" : 40, "ENTER" : 13, "PASTE" : 86};

// *****************************
// Quill Text editor Initialize
// *****************************
const options = {
    theme: null,
};
const quill = new Quill('.editor', options);
delete quill.getModule('keyboard').bindings["9"]
quill.on('editor-change', function(eventName, ...args) {
    console.log(args)
    if (eventName === 'selection-change') {
        if (args[0]) {
            console.log(1)
            // after pasting text, move cursor to end of pasted text'
            if (args[1] && args[2] === 'silent') {
                if(args[0].index > args[1].index) {
                    curCursor = args[0].index;
                    // setCurrentCursorPosition(curCursor);
                }
            }
            // else if(args[0]) {
            //     curCursor = args[0].index;
            // }

            deactivateMenu();
        }
    } else if (eventName === 'text-change') {
        console.log(2)
        setCurrentCursorPosition();
    }
});
const loader = document.querySelector('.loader');
quill.container.appendChild(loader);
quill.container.appendChild(menu);

// *************
// Editor Focus
// *************
let isFocus = false;

document.getElementById("editor").firstChild.onfocus = (e) => {
    e.target.parentElement.classList.add('focus-ring');
    isFocus = true;
};
document.getElementById("editor").firstChild.onblur = (e) => {
    e.target.parentElement.classList.remove('focus-ring');
    isFocus = false;
};

// *********************
// Text Cursor position
// *********************
let curCursor = 0;

// ***********
// share link
// ***********
const fb = document.getElementsByClassName('footer_facebook');
const tw = document.getElementsByClassName('footer_twitter');
const cp = document.getElementsByClassName('footer_link');

if (fb) {
    Array.from(fb).forEach(
      fb => fb.addEventListener("click", () => {
        window.open("https://www.facebook.com/sharer/sharer.php"
          +"?u="+encodeURIComponent(window.location.href)
        );
      })
    );
  }

if (tw) {
    Array.from(tw).forEach(
        tw => tw.addEventListener("click", () => {
            window.open("https://twitter.com/intent/tweet?="
                +"&url="+encodeURIComponent(window.location.href)
            );
        })
    );
}

if (cp) {
    Array.from(cp).forEach(
        cp => cp.addEventListener("click", copyToClipboard)
    );

    function copyToClipboard() {
        let t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = document.location.href;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
    }
}

// *************
// auto complete
// *************
function complete(){
    if (TAB_PRESS == true) return;
    TAB_PRESS = true;

    const select_model = document.getElementById("model");
    const model = select_model.options[select_model.selectedIndex].value;

    const select_length = document.getElementsByName("length");
    let length;

    if(select_length[0].checked == true) length = select_length[0].value;
    else if(select_length[1].checked == true) length = select_length[1].value;

    const formData = new FormData();
    const cur = getCurrentCursorPosition();
    const bounds = quill.getBounds(cur);
    loader.style.top = `${bounds.top}px`;
    loader.style.left = `${bounds.left}px`;
    loader.classList.remove('hide');

    formData.append("context", quill.getText(0, cur));
    formData.append("length", length);

    let post_path = '';
    if (model.startsWith('custom-')) {
        post_path = 'url';
        formData.append("model", modelUrl);
    } else {
        post_path = 'gpt2';
        formData.append("model", model);
    }

    fetch(post_path,
        {
            method: "POST",
            body: formData,
        }
    )
    .then(response => {
        if ( response.status == 200 ){
            loader.classList.add('hide')
            TAB_PRESS = false;
            return response;
        }
        else{
            loader.classList.add('hide');
            throw Error("gpt2-word error");
        }
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);
        // Response를 팝업 메뉴의 글씨로 설정
        for(let i=0; i<items.length; i++){
            // if (response[i] && response[i].startsWith(" ")) {
            //     response[i] = "&nbsp;"response[i];
            // }
            items[i].innerText = response[i].replace('\n', '↵');
        }

        // unset none of display attribute of menu
        menu.style.display = 'unset';
        menu.style.top = `${bounds.top + 16}px`;
        menu.style.left = `${bounds.left}px`;

        const menuBounds = menu.getBoundingClientRect();
        const editorBounds = editor.getBoundingClientRect();
        if (editorBounds.right < menuBounds.right) {
            menu.style.left = `${bounds.left - menuBounds.width}px`
        }

        TAB_ON = true;
        idx = 0;

        document.getElementsByClassName("wrap-item")[idx].focus();

    })
    .catch(e =>{
        TAB_PRESS = false;
    });
}

// paste plane text only https://stackoverflow.com/questions/12027137/javascript-trick-for-paste-as-plain-text-in-execcommand
editor.addEventListener('paste', (e) => {
     // cancel paste
     e.preventDefault();

     // get text representation of clipboard
     const text = (e.originalEvent || e).clipboardData.getData('text/plain');

     // insert text manually
     document.execCommand("insertHTML", false, text);
});

menu.addEventListener('mouseover', function(e){
    const idx = e.target.parentElement.tabIndex - 1;
    wrap_items[idx].focus();
    for(let i = 0; i < wrap_items.length; i++) {
        if (i !== idx) wrap_items[i].blur();
    }
})

$(document).on('mouseover', '.item', function(){
    if( TAB_ON == true ) {
        idx = this.parentElement.tabIndex-1;
        this.focus();
    }
});

$(document).on('click','.item',function(){
    if( TAB_ON == true ){
        quill.insertText(curCursor, this.innerText.replace('↵', '\n'));
        curCursor += this.innerText.length;
        // quill.insertText(curCursor, ' ');
        // curCursor ++;
        setCurrentCursorPosition();
        deactivateMenu();
    }
});

auto_button.onclick = function(){
    setCurrentCursorPosition();
    complete();
}

document.onkeydown = function(){
    const key = event.keyCode;

    // 탭을 누를 때, 5개의 추천 단어 활성화
    if(key == KEY_CODE.TAB){
        if (!isFocus && !TAB_ON) return;
        complete();

        // 주소창 focus를 막기
        event.preventDefault();
    }

    // TAB 활성화 && ENTER 혹은 (UP, DOWN을 제외한 나머지 키들)
    else if(TAB_ON == true && (key == KEY_CODE.ENTER || (key != KEY_CODE.UP && key != KEY_CODE.DOWN))){
        // ENTER 누를 때, 에디터에 해당 글자 대입
        if(key == KEY_CODE.ENTER){
            // after inserting text, move cursor to end of inserted text'
            quill.insertText(curCursor, wrap_items[idx].innerText.replace('↵', '\n'));
            curCursor += wrap_items[idx].innerText.length;
            // quill.insertText(curCursor, ' ');
            // curCursor ++;
            // 주소창 focus를 막기
            event.preventDefault();
        }
        setCurrentCursorPosition();
        deactivateMenu();
    }
    // TAB 활성화 && UP 혹은 DOWN
    else if(TAB_ON == true && (key == KEY_CODE.UP || key == KEY_CODE.DOWN)){
        // 주소창 focus를 막기
        event.preventDefault();

        if(key == KEY_CODE.UP && idx > 0) idx--;
        else if(key == KEY_CODE.DOWN && idx < 4) idx++;

        wrap_items[idx].focus();
        for(let i = 0; i < wrap_items.length; i++) {
            if (i !== idx) wrap_items[i].blur();
        }
    }
};

function deactivateMenu() {
    menu.style.display = "none";
    idx = 0;
    TAB_ON = false;
}

function getCurrentCursorPosition() {
    return curCursor = quill.getSelection().index;
}

// set cursor position to curCursor variable.
function setCurrentCursorPosition() {
    quill.setSelection(curCursor);
};

function showDescription(e){
    const description = document.getElementsByClassName("description")[0];
    const description_link = document.getElementById("description_link");

    switch (e.value){
        case "gpt2-large":
            description.innerHTML = "The GPT2-Large model generates the sentence.";
            description_link.style.href = 'https://ainize.ai/Jeong-Hyun-Su/gpt2-large';
            description_link.innerText = 'https://ainize.ai/Jeong-Hyun-Su/gpt2-large';
            break;

        case "gpt2-cover-letter":
            description.innerHTML = "The GPT2-Cover-Letter model generates cover letter style sentence.";
            description_link.href = 'https://ainize.ai/Jeong-Hyun-Su/gpt2-cover-letter';
            description_link.innerText = 'https://ainize.ai/Jeong-Hyun-Su/gpt2-cover-letter';
            break;

        case "gpt2-reddit":
            description.innerHTML = "The GPT2-Reddit model generates reddit style sentence.";
            description_link.href = 'https://ainize.ai/woomurf/gpt2-reddit';
            description_link.innerText = 'https://ainize.ai/woomurf/gpt2-reddit';
            break;

        case "gpt2-story":
            description.innerHTML = "The GPT2-Story model generates story style sentence.";
            description_link.href = 'https://ainize.ai/gmlee329/gpt2_story';
            description_link.innerText = 'https://ainize.ai/gmlee329/gpt2_story';
            break;

        case "gpt2-trump":
            description.innerHTML = "This GPT2-trump model generates Donald trump’s tweets style sentence.";
            description_link.href = 'https://ainize.ai/gmlee329/gpt2_trump';
            description_link.innerText = 'https://ainize.ai/gmlee329/gpt2_trump';
            break;
    }
}
