let fileInput = document.getElementById("fileInput");
let preview = document.getElementById("preview");
let loader = document.getElementById("loader");
let answer = document.getElementById("answerText");

fileInput.onchange = async function () {

let file = this.files[0];

if(file){

preview.src = URL.createObjectURL(file);
preview.style.display = "block";

loader.style.display = "block";
answer.innerHTML = "Reading image...";

try{

const { data:{ text } } = await Tesseract.recognize(file,"eng");

answer.innerHTML = "Solving...";

let res = await fetch("https://ominous-eureka-4q7ggw9grq5w3j4rp-3000.app.github.dev/solve",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
question:text
})
});

let data = await res.json();

loader.style.display = "none";
answer.innerHTML = data.answer;

}catch(err){
loader.style.display = "none";
answer.innerHTML = "Error: " + err;
}

}
};