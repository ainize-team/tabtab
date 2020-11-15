let idx = 0; // 탭 번호
let TAB_ON = false; // 탭 활성화
let TAB_PRESS = false;

let editor = document.getElementsByClassName("editor")[0];
let menu = document.getElementById("menu");
let items = document.getElementsByClassName("item");

let auto_button = document.getElementsByClassName("rectangle")[0];

const KEY_CODE = {"TAB" : 9, "UP" : 38, "DOWN" : 40, "ENTER" : 13, "PASTE" : 86};

// Quill Text editor Initialize
var options = {
    theme: null
};
var quill = new Quill('.editor', options);
delete quill.getModule('keyboard').bindings["9"]

// Editor Focus
let isFocus = false;

document.getElementById("editor").firstChild.onfocus = (e) => {
    e.target.parentElement.classList.add('focus-ring');
    isFocus = true;
};
document.getElementById("editor").firstChild.onblur = (e) => {
    e.target.parentElement.classList.remove('focus-ring');
    isFocus = false;
};

// Text Cursor position
let curCursor = 0;

// share link
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
    )
  }
  
if (tw) {
    Array.from(tw).forEach(
        tw => tw.addEventListener("click", () => {
            window.open("https://twitter.com/intent/tweet?="
                +"&url="+encodeURIComponent(window.location.href)
            );
        })
    )
}

if (cp) {
    Array.from(cp).forEach(
        cp => cp.addEventListener("click", copyToClipboard)
    )

    function copyToClipboard() {
        let t = document.createElement("textarea");
        document.body.appendChild(t);
        t.value = document.location.href;
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
    }
}

function complete(){
    if (TAB_PRESS == true) return;
    TAB_PRESS = true;

    const select_model = document.getElementById("model");
    const model = select_model.options[select_model.selectedIndex].value;

    const select_length = document.getElementsByName("length");
    let length;

    if(select_length[0].checked == true) length = select_length[0].value;
    else if(select_length[1].checked == true) length = select_length[1].value;

    let formData = new FormData();
    let cur = getCurrentCursorPosition();
    formData.append("context", quill.getText(0, cur));
    formData.append("model", model);
    formData.append("length", length);

    fetch("/gpt2",
        {
            method: "POST",
            body: formData,
        }
    )
    .then(response => {
        if ( response.status == 200 ){
            TAB_PRESS = false;
            return response;
        }
        else{
            throw Error("gpt2-word error");
        }
    })
    .then(response => response.json())
    .then(response => {
        menu = document.getElementById("menu");
        items = document.getElementsByClassName("item");

        // Response를 팝업 메뉴의 글씨로 설정
        for(let i=0; i<items.length; i++){
            items[i].innerHTML = response[i];
        }

        (function PopupShow(){
            // 커서의 위치 Get
            const selection = window.getSelection().getRangeAt(0);

            const clientRects = selection.getClientRects();

            let cur_left;
            let cur_top;

            if(clientRects[0].left + 200 < screen.width)
                cur_left = String(clientRects[0].left) + "px";
            else
                cur_left = String(screen.width - 200 - 3) + "px";

            cur_top = String(window.pageYOffset + clientRects[0].top + 27) + "px";

            // Tab을 누를 경우, 팝업 메뉴가 뜸 ( 커서의 위치를 기준으로 )
            menu.style.left = cur_left;
            menu.style.top = cur_top;
            menu.style.display = "block";
            menu.style.position = "absolute";
        })();

        TAB_ON = true;
        idx = 0;

        document.getElementsByClassName("wrap-item")[idx].focus();

    })
    .catch(e =>{
        TAB_PRESS = false;
    });
}

editor.onclick = function(){
    // 탭 비활성화
    menu.style.display = "none";
    idx = 0;
    TAB_ON = false;
}

editor.addEventListener('paste', (event) => {
    let paste = (event.clipboardData || window.clipboardData).getData('text');
 
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(paste));

    event.preventDefault();
});

$(document).on('mouseover', '.item', function(){
    if( TAB_ON == true ) {
         idx = this.parentElement.tabIndex-1;
         this.focus();
    }
 });
$(document).on('click','.item',function(){
    if( TAB_ON == true ){
        quill.insertText(curCursor, this.innerText)
        curCursor += this.innerText.length;
        setCurrentCursorPosition();
        
        // 탭 비활성화
        menu.style.display = "none";
        idx = 0;
        TAB_ON = false;
    }
});

auto_button.onclick = function(){
    setCurrentCursorPosition();
    complete();
}

document.onkeydown = function(){
    if (!isFocus) return;

    const key = event.keyCode;

    // 탭을 누를 때, 5개의 추천 단어 활성화
    if(key == KEY_CODE.TAB){
        complete();

        // 주소창 focus를 막기
        event.preventDefault();
    }

    // TAB 활성화 && ENTER 혹은 (UP, DOWN을 제외한 나머지 키들)
    else if(TAB_ON == true && (key == KEY_CODE.ENTER || (key != KEY_CODE.UP && key != KEY_CODE.DOWN))){
        // ENTER 누를 때, 에디터에 해당 글자 대입
        if(key == KEY_CODE.ENTER){
            const charList = [",", ".", "(", ")", "?", "!", "{", "}", "[", "]"];
            let charHas = false;
            wrap_items = document.getElementsByClassName("wrap-item");

            for(let i=0; i<charList.length; i++){
                if(wrap_items[idx].innerText[0] == charList[i])
                    charHas = true;
            }
            quill.insertText(curCursor, wrap_items[idx].innerText)
            curCursor += wrap_items[idx].innerText.length;

            // 주소창 focus를 막기
            event.preventDefault();
        }
        // 커서 이동 마지막 문자로,
        setCurrentCursorPosition();

        // 탭 비활성화
        menu.style.display = "none";
        idx = 0;
        TAB_ON = false;
    }
    // TAB 활성화 && UP 혹은 DOWN
    else if(TAB_ON == true && (key == KEY_CODE.UP || key == KEY_CODE.DOWN)){
        // 주소창 focus를 막기
        event.preventDefault();

        // 해당 아이템 포커싱
        wrap_items = document.getElementsByClassName("wrap-item");

        if(key == KEY_CODE.UP && idx > 0) idx--;
        else if(key == KEY_CODE.DOWN && idx < 4) idx++;

        wrap_items[idx].focus();
    }
};

function getCurrentCursorPosition() {
    return curCursor = quill.getSelection().index;
}

function setCurrentCursorPosition() {
    quill.setSelection(curCursor);
};

function showDescription(e){
    const description = document.getElementsByClassName("description")[0];

    switch (e.value){
        case "gpt2-large":
            description.innerHTML = "This is the basic model in GPT-2." + 
            "<br><br><a href='https://ainize.ai/Jeong-Hyun-Su/gpt2-large' style='color: #FFFFFF;'>https://ainize.ai/Jeong-Hyun-Su/gpt2-large</a>";
            break;

        case "gpt2-cover-letter":
            description.innerHTML = "generate cover-letter sentence based fine-tuned gpt2 model" + 
            "<br><br><a href='https://ainize.ai/Jeong-Hyun-Su/gpt2-cover-letter' style='color: #FFFFFF;'>https://ainize.ai/Jeong-Hyun-Su/gpt2-cover-letter</a>";
            break;

        case "gpt2-reddit":
            description.innerHTML = "GPT2-reddit is trained by reddit data and generate words and sentences like community posts." +
            "<br><br><a href='https://ainize.ai/woomurf/gpt2-reddit' style='color: #FFFFFF;'>https://ainize.ai/woomurf/gpt2-reddit</a>";
            break;

        case "gpt2-story":
            description.innerHTML = "This GPT2-story model generates genre story text. When you enter text at the beginning of the story, the model gives you the rest of the story as long as you want." +
            "<br><br><a href='https://ainize.ai/gmlee329/gpt2_story' style='color: #FFFFFF;'>https://ainize.ai/gmlee329/gpt2_story</a>";
            break;

        case "gpt2-ads":
            description.innerHTML = "GPT-2 model that has been Fine Tuned to generate an advertisement." + 
            "<br><br><a href='https://ainize.ai/psi1104/gpt2-ads' style='color: #FFFFFF;'>https://ainize.ai/psi1104/gpt2-ads</a>";
            break;

        case "gpt2-film":
            description.innerHTML = "This GPT2-film model generates film script text. When you enter text for the beginning of the film script, the model gives you the rest of the film script as long as you want." +
            "<br><br><a href='https://ainize.ai/gmlee329/gpt2_film' style='color: #FFFFFF;'>https://ainize.ai/gmlee329/gpt2_film</a>";
            break;

        case "gpt2-business":
            description.innerHTML = "business style GPT2 model" + 
            "<br><br><a href='https://ainize.ai/leesangha/gpt2-business' style='color: #FFFFFF;'>https://ainize.ai/leesangha/gpt2-business</a>";
            break;

        case "gpt2-trump":
            description.innerHTML = "This GPT2-trump model generates Donald trump’s tweets style text. When you enter text for the beginning of the tweets, the model gives you the rest of the tweets as long as you want." +
            "<br><br><a href='https://ainize.ai/gmlee329/gpt2_trump' style='color: #FFFFFF;'>https://ainize.ai/gmlee329/gpt2_trump</a>";
            break;
    }
}
