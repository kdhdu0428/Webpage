
"use strict";

/* =========================
   피자 사이즈 및 가격
========================= */

const PIZZA_SIZES = Object.freeze({

  S: Object.freeze({
    name: "Small",
    inches: 8,
    price: 12000
  }),

  M: Object.freeze({
    name: "Medium",
    inches: 10,
    price: 15000
  }),

  L: Object.freeze({
    name: "Large",
    inches: 13,
    price: 18000
  })

});


/* =========================
   토핑 가격 및 사진 경로
========================= */

const TOPPINGS = Object.freeze({

  cheese: Object.freeze({
    name: "치즈",
    price: 2000,
    image: "images/cheese.png"
  }),

  pepperoni: Object.freeze({
    name: "페퍼로니",
    price: 1500,
    image: "images/pepperoni.png"
  }),

  mushroom: Object.freeze({
    name: "버섯",
    price: 1000,
    image: "images/mushroom.png"
  }),

  olive: Object.freeze({
    name: "올리브",
    price: 1000,
    image: "images/olive.png"
  })

});


/* =========================
   토핑 배치 위치
========================= */

const TOPPING_POSITIONS = {

  cheese: [
    [25, 25],
    [55, 20],
    [75, 45],
    [35, 60],
    [65, 75],
    [20, 50]
  ],

  pepperoni: [
    [50, 12],
    [23, 28],
    [75, 25],
    [50, 50],
    [12, 60],
    [85, 60],
    [35, 82],
    [68, 80]
  ],

  mushroom: [
    [35, 15],
    [65, 35],
    [20, 45],
    [45, 70],
    [78, 70]
  ],

  olive: [
    [15, 35],
    [40, 30],
    [85, 40],
    [30, 55],
    [60, 60],
    [50, 88]
  ]

};


/* =========================
   기본 설정
========================= */

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;
const MAX_REQUEST_LENGTH = 200;

let quantity = 1;
let pendingOrder = null;
let lastToppingKey = null;


/* =========================
   HTML 요소 연결
========================= */

const form = document.getElementById("order-form");

const pizza = document.getElementById("pizza");

const toppingLayer =
  document.getElementById("topping-layer");

const pizzaSizeLabel =
  document.getElementById("pizza-size-label");

const quantityOutput =
  document.getElementById("quantity");

const minusBtn =
  document.getElementById("minus-btn");

const plusBtn =
  document.getElementById("plus-btn");

const requestInput =
  document.getElementById("request");

const charCount =
  document.getElementById("char-count");

const totalPriceOutput =
  document.getElementById("total-price");

const formError =
  document.getElementById("form-error");

const orderBtn =
  document.getElementById("order-btn");

const confirmDialog =
  document.getElementById("confirm-dialog");

const completeDialog =
  document.getElementById("complete-dialog");

const confirmBtn =
  document.getElementById("confirm-btn");

const cancelBtn =
  document.getElementById("cancel-btn");

const completeBtn =
  document.getElementById("complete-btn");


/* =========================
   금액 표시
========================= */

function formatPrice(price) {

  return price.toLocaleString("ko-KR") + "원";

}


/* =========================
   상단 메뉴 화면 전환
========================= */

function showPage(pageName) {

  const allowedPages = [
    "home",
    "menu",
    "order"
  ];

  if (!allowedPages.includes(pageName)) {
    return;
  }

  document.querySelectorAll(".page").forEach((page) => {

    page.hidden = page.id !== pageName;

  });

  document.querySelectorAll(".nav-link").forEach((button) => {

    const isActive =
      button.dataset.page === pageName;

    button.classList.toggle("active", isActive);

    if (isActive) {

      button.setAttribute("aria-current", "page");

    } else {

      button.removeAttribute("aria-current");

    }

  });

  window.scrollTo(0, 0);

}


document.querySelectorAll("[data-page]").forEach((button) => {

  button.addEventListener("click", () => {

    showPage(button.dataset.page);

  });

});


/* =========================
   MENU에서 사이즈 선택
========================= */

document.querySelectorAll("[data-order-size]").forEach((button) => {

  button.addEventListener("click", () => {

    const selectedSize = button.dataset.orderSize;

    if (!Object.hasOwn(PIZZA_SIZES, selectedSize)) {
      return;
    }

    form.querySelectorAll('input[name="size"]').forEach((input) => {

      input.checked = input.value === selectedSize;

    });

    updateOrder();

    showPage("order");

  });

});


/* =========================
   주문 데이터 검증
========================= */

function getOrderData() {

  const selectedSize = form.querySelector(
    'input[name="size"]:checked'
  );

  if (
    !selectedSize ||
    !Object.hasOwn(PIZZA_SIZES, selectedSize.value)
  ) {

    throw new Error(
      "올바른 피자 사이즈를 선택해 주세요."
    );

  }

  const size = selectedSize.value;

  const selectedToppings = Array.from(

    form.querySelectorAll(
      'input[name="topping"]:checked'
    )

  ).map((input) => input.value);


  // 등록되지 않은 토핑 차단

  if (

    selectedToppings.some((topping) => {

      return !Object.hasOwn(TOPPINGS, topping);

    })

  ) {

    throw new Error(
      "올바른 토핑을 선택해 주세요."
    );

  }


  // 중복 토핑 계산 방지

  const toppings = [...new Set(selectedToppings)];


  // 수량 검증

  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_QUANTITY ||
    quantity > MAX_QUANTITY
  ) {

    throw new Error(
      "수량은 1개부터 10개까지 선택해 주세요."
    );

  }


  // 요청사항 길이 검증

  const request = requestInput.value;

  if (request.length > MAX_REQUEST_LENGTH) {

    throw new Error(
      "요청사항은 최대 200자까지 입력할 수 있습니다."
    );

  }


  // 기본 가격

  const basePrice = PIZZA_SIZES[size].price;


  // 추가 토핑 가격

  const extraPrice = toppings.reduce((sum, topping) => {

    return sum + TOPPINGS[topping].price;

  }, 0);


  // 총 주문 금액

  const totalPrice =
    (basePrice + extraPrice) * quantity;


  return {

    size,
    toppings,
    quantity,
    request: request.trim(),
    basePrice,
    extraPrice,
    totalPrice

  };

}


/* =========================
   추가 토핑 사진 표시
========================= */

function renderToppings(selectedToppings) {

  const toppingKey = [...selectedToppings]
    .sort()
    .join(",");

  // 토핑이 바뀌지 않았다면 다시 그리지 않음

  if (lastToppingKey === toppingKey) {
    return;
  }

  lastToppingKey = toppingKey;

  toppingLayer.replaceChildren();

  selectedToppings.forEach((topping) => {

    const positions = TOPPING_POSITIONS[topping];

    positions.forEach((position, index) => {

      const toppingImage =
        document.createElement("img");

      toppingImage.src = TOPPINGS[topping].image;

      toppingImage.alt = "";

      toppingImage.className = "topping-piece";

      toppingImage.style.left =
        position[0] + "%";

      toppingImage.style.top =
        position[1] + "%";

      toppingImage.style.transform =
        `translate(-50%, -50%) rotate(${index * 35}deg)`;


      // 토핑 사진이 없는 경우 깨진 이미지 숨김

      toppingImage.addEventListener("error", () => {

        toppingImage.hidden = true;

      });


      toppingLayer.appendChild(toppingImage);

    });

  });

}


/* =========================
   피자 크기 및 금액 변경
========================= */

function updateOrder() {

  try {

    const order = getOrderData();

    const sizeInfo = PIZZA_SIZES[order.size];


    // 기존 피자 사이즈 제거

    pizza.classList.remove(
      "size-S",
      "size-M",
      "size-L"
    );


    // 선택한 피자 사이즈 적용

    pizza.classList.add(
      `size-${order.size}`
    );


    // 사이즈 문구 변경

    pizzaSizeLabel.textContent =
      `${sizeInfo.name} · ${sizeInfo.inches}인치`;


    // 수량 변경

    quantityOutput.textContent =
      order.quantity;


    // 총 주문 금액 변경

    totalPriceOutput.textContent =
      formatPrice(order.totalPrice);


    // 수량 버튼 활성화 및 비활성화

    minusBtn.disabled =
      quantity <= MIN_QUANTITY;

    plusBtn.disabled =
      quantity >= MAX_QUANTITY;


    // 요청사항 글자 수

    charCount.textContent =
      `${requestInput.value.length}/${MAX_REQUEST_LENGTH}자`;


    // 토핑 사진 표시

    renderToppings(order.toppings);


    formError.textContent = "";

    orderBtn.disabled = false;

  } catch (error) {

    formError.textContent = error.message;

    orderBtn.disabled = true;

  }

}


/* =========================
   사이즈 및 토핑 변경
========================= */

form.addEventListener("change", (event) => {

  if (
    event.target.name === "size" ||
    event.target.name === "topping"
  ) {

    updateOrder();

  }

});


/* =========================
   수량 감소
========================= */

minusBtn.addEventListener("click", () => {

  if (quantity > MIN_QUANTITY) {

    quantity--;

    updateOrder();

  }

});


/* =========================
   수량 증가
========================= */

plusBtn.addEventListener("click", () => {

  if (quantity < MAX_QUANTITY) {

    quantity++;

    updateOrder();

  }

});


/* =========================
   요청사항 입력
========================= */

requestInput.addEventListener("input", () => {

  if (requestInput.value.length > MAX_REQUEST_LENGTH) {

    requestInput.value =
      requestInput.value.slice(0, MAX_REQUEST_LENGTH);

  }

  updateOrder();

});


/* =========================
   초기화 기능
========================= */

form.addEventListener("reset", () => {

  quantity = 1;

  pendingOrder = null;

  // 기본 입력값 복원 후 화면 갱신

  queueMicrotask(() => {

    updateOrder();

  });

});


/* =========================
   주문 확인 팝업
========================= */

form.addEventListener("submit", (event) => {

  event.preventDefault();

  if (
    confirmDialog.open ||
    completeDialog.open
  ) {

    return;

  }

  try {

    const order = getOrderData();

    pendingOrder = order;


    // 피자 사이즈

    document.getElementById("confirm-size").textContent =
      `${PIZZA_SIZES[order.size].name} · ${PIZZA_SIZES[order.size].inches}인치`;


    // 추가 토핑

    const toppingNames = order.toppings.map((topping) => {

      return TOPPINGS[topping].name;

    });

    document.getElementById("confirm-toppings").textContent =
      toppingNames.length > 0
        ? toppingNames.join(", ")
        : "없음";


    // 수량

    document.getElementById("confirm-quantity").textContent =
      `${order.quantity}개`;


    // 요청사항
    // textContent를 사용하여 HTML 코드 실행 방지

    document.getElementById("confirm-request").textContent =
      order.request || "없음";


    // 총 주문 금액

    document.getElementById("confirm-total").textContent =
      formatPrice(order.totalPrice);


    // 주문 확인 팝업 열기

    confirmBtn.disabled = false;

    confirmDialog.showModal();

  } catch (error) {

    formError.textContent = error.message;

  }

});


/* =========================
   주문 취소
========================= */

cancelBtn.addEventListener("click", () => {

  pendingOrder = null;

  confirmDialog.close();

});


/* =========================
   최종 주문 확인
========================= */

confirmBtn.addEventListener("click", () => {

  if (
    !pendingOrder ||
    !confirmDialog.open
  ) {

    return;

  }


  // 중복 주문 방지

  confirmBtn.disabled = true;

  pendingOrder = null;

  confirmDialog.close();

  completeDialog.showModal();

});


/* =========================
   다시 주문하기
========================= */

completeBtn.addEventListener("click", () => {

  completeDialog.close();

  form.reset();

  showPage("order");

});


/* =========================
   팝업 종료 처리
========================= */

confirmDialog.addEventListener("close", () => {

  pendingOrder = null;

  confirmBtn.disabled = false;

});

completeDialog.addEventListener("cancel", (event) => {

  event.preventDefault();

  completeDialog.close();

  form.reset();

});


/* =========================
   최초 화면 실행
========================= */

showPage("order");

updateOrder();
