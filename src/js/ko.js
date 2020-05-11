const texts = {
  noAccount: "등록된 계정이 없습니다. /start 명령어를 입력하여 주십시오.",
  errormsg: `Something is wrong. Please contact the developer.`,
  catToLong: `카테고리명이 너무 깁니다. 100자를 넘으면 안됩니다. 다시 입력하여 주십시오.`,
  catRegOk: `카테고리 등록이 완료되었습니다.`,
  help: `<b><u>English King Bot을 이용해주셔서 감사합니다.</u></b>
  아래와 같은 명령어를 사용하실 수 있습니다.
    
    <b>- 단어(문장) 등록(단어 - 설명)</b>
    <b>- 등록된 문장 검색</b>
    <b>- 등록된 문장 수정/삭제</b>
    <b>- 저장된 단어 랜덤 표시(시험출제용)</b>
    <b>- 저장된 설명 랜덤 표시(시험출제용)</b>
    `,
  welcome: `<b><u>English King 메신저에 오신것을 환영합니다.</u></b>
    자신만의 문장을 등록/수정/삭제/검색이 가능하고, 랜덤출제 기능도 제공하여 암기에 도움이 됩니다.
    
    어떤 기능을 사용해 보시겠습니까?
    `,
  registerWord: `<b><u>단어(문장) 등록 메뉴입니다.</u></b>
  입력하시려는 단어와 문장을 아래의 형태로 입력을 해주세요.
  
  단어-문장
  단어-설명
  
  ex)apple-사과
  ex)메신저-실시간으로 메시지와 데이터를 주고받을 수 있는 프로그램
  `,
  notFitFormat: `입력된 형태가 인식되지 않습니다. <b>단어-설명</b> 형태로 입력 되었는지 확인바랍니다.`,
  finishRegister: `등록이 완료되었습니다.`,
  selectCategory: `<b><u>등록할 카테고리를 선택하세요</u></b>.

  최초로 입력하는 경우 "새카테고리" 선택 후 입력해주세요.`,
};

module.exports = texts;
