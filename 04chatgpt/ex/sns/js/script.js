
document.addEventListener("DOMContentLoaded", () => {

  // 사진 슬라이드
  const photoTrack = document.getElementById("photoTrack");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  const indicators = document.querySelectorAll(".indicator");

  let currentSlide = 0;
  const totalSlides = document.querySelectorAll(".photo-slide").length;

  function updateSlide() {
    photoTrack.style.transform =
      `translateX(-${currentSlide * 100}%)`;

    indicators.forEach((indicator, index) => {
      const active = index === currentSlide;
      indicator.classList.toggle("active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  prevButton.addEventListener("click", () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlide();
  });

  nextButton.addEventListener("click", () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlide();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      currentSlide = index;
      updateSlide();
    });
  });

  updateSlide();


  // 좋아요 버튼
  const likeButton = document.getElementById("likeButton");
  const likeIcon = document.getElementById("likeIcon");

  let liked = false;

  likeButton.addEventListener("click", () => {
    liked = !liked;

    likeIcon.textContent = liked ? "♥" : "♡";
    likeIcon.style.color = liked ? "#e45566" : "#73889c";

    likeButton.classList.toggle("liked", liked);
    likeButton.setAttribute("aria-pressed", String(liked));
  });


  // 댓글 입력 및 글자 수
  const commentInput = document.getElementById("commentInput");
  const currentCount = document.getElementById("currentCount");
  const commentSubmit = document.getElementById("commentSubmit");

  function updateCommentState() {
    const length = commentInput.value.length;

    currentCount.textContent = length;

    commentSubmit.disabled =
      commentInput.value.trim().length === 0 ||
      length > 200;
  }

  commentInput.addEventListener("input", updateCommentState);

  updateCommentState();


  // 댓글 등록 안내 팝업
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBox = modalOverlay.querySelector(".modal-box");
  const modalClose = document.getElementById("modalClose");
  const modalConfirm = document.getElementById("modalConfirm");

  let previousFocus = null;

  function openModal() {
    previousFocus = document.activeElement;

    modalOverlay.classList.add("show");
    modalOverlay.setAttribute("aria-hidden", "false");

    modalConfirm.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove("show");
    modalOverlay.setAttribute("aria-hidden", "true");

    if (previousFocus) {
      previousFocus.focus();
    }
  }

  commentSubmit.addEventListener("click", () => {
    if (commentInput.value.trim().length === 0) {
      return;
    }

    openModal();
  });

  modalClose.addEventListener("click", closeModal);
  modalConfirm.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!modalOverlay.classList.contains("show")) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "Tab") {
      const focusable = [modalClose, modalConfirm];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

});
