(function () {
  "use strict";

  const SUPABASE_URL = "https://lggboavbzzvoomveewtl.supabase.co";
  const SUPABASE_KEY =
    "sb_publishable_3Z7UGlah1I0yJE7gHQQ57A_1XNEeauM";

  const likeBoxes = document.querySelectorAll(".carmen-like");

  if (!likeBoxes.length) {
    return;
  }

  const style = document.createElement("style");

  style.textContent = `
    .carmen-like {
      width: min(760px, calc(100% - 32px));
      margin: 48px auto;
      padding: 34px 25px;
      text-align: center;
      color: #2e2026;
      background:
        radial-gradient(
          circle at top,
          rgba(255, 255, 255, 0.96),
          rgba(255, 239, 245, 0.94)
        );
      border: 1px solid rgba(189, 73, 111, 0.20);
      border-radius: 22px;
      box-shadow: 0 15px 38px rgba(117, 58, 79, 0.10);
    }

    .carmen-like__message {
      margin: 0 0 22px;
      color: #71384f;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(18px, 2.2vw, 23px);
      line-height: 1.55;
    }

    .carmen-like__button {
      min-width: 210px;
      padding: 14px 24px;
      border: 0;
      border-radius: 13px;
      color: #ffffff;
      background: linear-gradient(
        135deg,
        #bd496f,
        #dc638b
      );
      font-family: Arial, Helvetica, sans-serif;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(189, 73, 111, 0.24);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        opacity 0.2s ease;
    }

    .carmen-like__button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 31px rgba(189, 73, 111, 0.31);
    }

    .carmen-like__button:disabled {
      cursor: default;
      opacity: 0.82;
    }

    .carmen-like__button.is-liked {
      color: #bd496f;
      background: #ffffff;
      outline: 2px solid #dc638b;
      box-shadow: 0 9px 23px rgba(189, 73, 111, 0.15);
    }

    .carmen-like__heart {
      display: inline-block;
      margin-right: 5px;
    }

    .carmen-like__button.is-animating .carmen-like__heart {
      animation: carmenHeart 0.75s ease;
    }

    .carmen-like__thanks {
      min-height: 24px;
      margin: 16px 0 0;
      color: #bd496f;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    .carmen-like__thanks.is-visible {
      opacity: 1;
    }

    .carmen-like__error {
      color: #923e4e;
    }

    @keyframes carmenHeart {
      0% {
        transform: scale(1);
      }

      35% {
        transform: scale(1.55) rotate(-8deg);
      }

      65% {
        transform: scale(1.25) rotate(7deg);
      }

      100% {
        transform: scale(1);
      }
    }

    @media (max-width: 520px) {
      .carmen-like {
        margin: 34px auto;
        padding: 28px 18px;
        border-radius: 18px;
      }

      .carmen-like__button {
        width: 100%;
        max-width: 320px;
      }
    }
  `;

  document.head.appendChild(style);

  function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function callSupabase(functionName, pageId) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requested_page_id: pageId
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Supabase odpověděl chybou ${response.status}: ${errorText}`
      );
    }

    return response.json();
  }

  async function createLikeBox(box) {
    const pageId = box.dataset.page;

    if (!pageId) {
      console.error(
        "Bloku .carmen-like chybí atribut data-page."
      );

      return;
    }

    box.innerHTML = `
      <p class="carmen-like__message">
        ❤️ Pokud se vám tato stránka líbila,
        můžete jí dát své srdce.
      </p>

      <button
        class="carmen-like__button"
        type="button"
        disabled
        aria-label="Dát této stránce srdce"
      >
        <span class="carmen-like__heart">♡</span>
        <span class="carmen-like__label">Načítám…</span>
      </button>

      <p
        class="carmen-like__thanks"
        aria-live="polite"
      ></p>
    `;

    const button = box.querySelector(".carmen-like__button");
    const heart = box.querySelector(".carmen-like__heart");
    const label = box.querySelector(".carmen-like__label");
    const thanks = box.querySelector(".carmen-like__thanks");

    const storageKey = `svetCarmenLike_${pageId}`;
    const likedToday =
      localStorage.getItem(storageKey) === getToday();

    function showCount(count) {
      label.textContent = `Líbí se mi ${Number(count) || 0}`;
    }

    function lockButton() {
      button.disabled = true;
      button.classList.add("is-liked");
      heart.textContent = "♥";
      thanks.textContent =
        "Děkujeme za vaše srdce. ❤️";
      thanks.classList.add("is-visible");
    }

    try {
      const count = await callSupabase(
        "get_page_likes",
        pageId
      );

      showCount(count);

      if (likedToday) {
        lockButton();
      } else {
        button.disabled = false;
      }
    } catch (error) {
      console.error(error);

      label.textContent = "Líbí se mi";
      thanks.textContent =
        "Počet srdcí se nyní nepodařilo načíst.";
      thanks.classList.add(
        "is-visible",
        "carmen-like__error"
      );
    }

    button.addEventListener("click", async function () {
      if (
        button.disabled ||
        localStorage.getItem(storageKey) === getToday()
      ) {
        return;
      }

      button.disabled = true;
      label.textContent = "Odesílám srdce…";

      try {
        const newCount = await callSupabase(
          "add_page_like",
          pageId
        );

        localStorage.setItem(storageKey, getToday());

        showCount(newCount);
        lockButton();

        button.classList.add("is-animating");

        window.setTimeout(function () {
          button.classList.remove("is-animating");
        }, 800);
      } catch (error) {
        console.error(error);

        button.disabled = false;
        label.textContent = "Zkusit znovu";
        thanks.textContent =
          "Srdce se nepodařilo odeslat. Zkuste to prosím znovu.";
        thanks.classList.add(
          "is-visible",
          "carmen-like__error"
        );
      }
    });
  }

  likeBoxes.forEach(createLikeBox);
})();
