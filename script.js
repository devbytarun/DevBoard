let selectedRole = ""
let activeGithub = ""

const obNameInput = document.getElementById("ob-name")
const obGithubInput = document.getElementById("ob-github")
const obError = document.getElementById("obError")
const onboardingEl = document.getElementById("onboarding")
const dashboardEl = document.getElementById("dashboard")
const ghCacheTtlMs = 30 * 60 * 1000


document.querySelectorAll(".role-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if(btn.classList.contains("active")) {
      btn.classList.remove("active")
      selectedRole = ""
    } else {
      document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      selectedRole = btn.textContent.trim()
    }
    obError.classList.add("hidden")
  })
})


document.getElementById("enterBtn").addEventListener("click", () => {
  const name = obNameInput.value.trim()
  const github = obGithubInput.value.trim().replace(/^@/, "")

  if(name === "") { obError.textContent = "Please enter your Name!"; obError.classList.remove("hidden"); return }
  if(github === "") { obError.textContent = "Please enter your GitHub username!"; obError.classList.remove("hidden"); return }
  if(selectedRole === "") { obError.textContent = "Please select a role!"; obError.classList.remove("hidden"); return }

  localStorage.setItem("db_name", name)
  localStorage.setItem("db_github", github)
  localStorage.setItem("db_role", selectedRole)

  loadDashboard(name, github, selectedRole)
})

function getGithubCache(github) {
  try {
    const raw = localStorage.getItem(`gh_cache_${github.toLowerCase()}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setGithubCache(github, data) {
  try {
    localStorage.setItem(
      `gh_cache_${github.toLowerCase()}`,
      JSON.stringify({ timestamp: Date.now(), data })
    )
  } catch {
    // ignore cache errors
  }
}

function renderGithubData(data, github) {
  document.getElementById("ghName").textContent = data.name || data.login || "Name"
  document.getElementById("ghHandle").textContent = "@" + (data.login || github)
  document.getElementById("ghRepos").textContent = data.public_repos ?? "-"
  document.getElementById("ghFollowers").textContent = data.followers ?? "-"
  document.getElementById("ghFollowing").textContent = data.following ?? "-"
  document.getElementById("ghStars").textContent = data.public_gists ?? "-"

  if (data.avatar_url) {
    document.getElementById("ghAvatar").innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
    document.getElementById("sideAvatar").innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
  }

  document.getElementById("streakImg").src = `https://github-readme-activity-graph.vercel.app/graph?username=${github}&theme=github-compact&hide_border=true`
}

function fetchGitHub(github) {
  github = (github || "").trim().replace(/^@/, "")
  if (!github) return

  activeGithub = github
  document.getElementById("ghName").textContent = "Loading..."
  document.getElementById("ghHandle").textContent = "@" + github
  document.getElementById("ghRepos").textContent = "-"
  document.getElementById("ghFollowers").textContent = "-"
  document.getElementById("ghFollowing").textContent = "-"
  document.getElementById("ghStars").textContent = "-"
  document.getElementById("followBtn").href = `https://github.com/${github}`

  const cached = getGithubCache(github)
  if (cached && cached.data && Date.now() - cached.timestamp < ghCacheTtlMs) {
    renderGithubData(cached.data, github)
    return
  }

  fetch(`https://api.github.com/users/${encodeURIComponent(github)}`)
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || "GitHub API error")
        })
      }
      return res.json()
    })
    .then(data => {
      if(data.message === "Not Found") {
        document.getElementById("ghName").textContent = "User not found!"
        return
      }
      renderGithubData(data, github)
      setGithubCache(github, data)
    })
    .catch((err) => {
      if ((err.message || "").toLowerCase().includes("rate limit")) {
        if (cached && cached.data) {
          renderGithubData(cached.data, github)
          document.getElementById("ghName").textContent = `${cached.data.name || cached.data.login || github} (cached)`
        } else {
          document.getElementById("ghName").textContent = "GitHub rate limit hit"
        }
      } else {
        document.getElementById("ghName").textContent = "Error loading data!"
      }
    })
}


document.getElementById("shareBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(`https://github.com/${activeGithub}`)
  document.getElementById("shareBtn").textContent = "Copied!"
  setTimeout(() => {
    document.getElementById("shareBtn").textContent = "Share Profile"
  }, 2000)
})


function loadDashboard(name, github, role) {
  onboardingEl.classList.add("hidden")
  dashboardEl.classList.remove("hidden")
  document.getElementById("sideName").textContent = name
  document.getElementById("sideRole").textContent = role
  fetchGitHub(github)
}

function logoutDashboard() {
  localStorage.removeItem("db_name")
  localStorage.removeItem("db_github")
  localStorage.removeItem("db_role")

  selectedRole = ""
  activeGithub = ""
  obNameInput.value = ""
  obGithubInput.value = ""
  obError.classList.add("hidden")
  document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"))

  document.getElementById("sideName").textContent = "Name"
  document.getElementById("sideRole").textContent = "Role"
  document.getElementById("ghName").textContent = "Name"
  document.getElementById("ghHandle").textContent = "@username"
  document.getElementById("ghRepos").textContent = "-"
  document.getElementById("ghFollowers").textContent = "-"
  document.getElementById("ghFollowing").textContent = "-"
  document.getElementById("ghStars").textContent = "-"
  document.getElementById("streakImg").removeAttribute("src")
  document.getElementById("followBtn").href = ""
  document.getElementById("shareBtn").textContent = "Share Profile"
  document.getElementById("sideAvatar").innerHTML = "T"
  document.getElementById("ghAvatar").innerHTML = "T"

  dashboardEl.classList.add("hidden")
  onboardingEl.classList.remove("hidden")
}

const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn")
if (sidebarLogoutBtn) {
  sidebarLogoutBtn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    logoutDashboard()
  })
}

document.addEventListener("click", (e) => {
  const logoutTarget = e.target.closest("#sidebarLogoutBtn")
  if (!logoutTarget) return
  e.preventDefault()
  logoutDashboard()
})


window.addEventListener("load", () => {
  const name = localStorage.getItem("db_name")
  const github = localStorage.getItem("db_github")
  const role = localStorage.getItem("db_role")
  if(name && github && role) loadDashboard(name, github, role)
})
