let selectedRole = "";

const safeStorageSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Local storage is unavailable in this browser context.", error);
  }
};

document.querySelectorAll(".role-btn").forEach((btn) => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");
    selectedRole = btn.textContent;
  });
});



document.querySelector("#enterBtn").addEventListener('click', () => {
      let name = document.getElementById("ob-name").value;
      let github = document.getElementById("ob-github").value

      if(name == ""){
alert("Please enter your name!")
      }

     else if(github == ""){
alert("Please enter your username!")
      }

      else{
          safeStorageSet('db_name', name)
    safeStorageSet('db_github', github)
    safeStorageSet('db_role', selectedRole)

document.getElementById('onboarding').classList.add('hidden')
document.getElementById('dashboard').classList.remove('hidden')
      }
})
