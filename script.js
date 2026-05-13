let fileInput = document.getElementById("fileInput");
let preview = document.getElementById("preview");
let loader = document.getElementById("loader");
let answer = document.getElementById("answerText");
let language = document.getElementById("language");

fileInput.onchange = async function () {

  let file = this.files[0];

  if (file) {

    // Image Preview
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    // Loading
    loader.style.display = "block";

    answer.innerHTML = "Solving with AI...";

    try {

      // Form Data
      let formData = new FormData();

      formData.append("image", file);

      formData.append("language", language.value);

      // Backend Request
      let res = await fetch(
        "https://snapsolveai-backend-production.up.railway.app/solve",
        {
          method: "POST",
          body: formData
        }
      );

      let data = await res.json();

      loader.style.display = "none";

      // Success
      if (data.success) {

        answer.innerHTML = `
        <h3>Solution (${language.value})</h3>
        <p>${data.answer}</p>
        `;

      } else {

        answer.innerHTML = `
        <p>AI Error: ${data.message}</p>
        `;

      }

    } catch (err) {

      loader.style.display = "none";

      answer.innerHTML = `
      <p>Error: ${err.message}</p>
      `;

    }

  }

};
