(function () {
  var KEY = "e1.theme";
  var root = document.documentElement;

  function saved() {
    try {
      return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  }

  function apply(theme) {
    root.dataset.theme = theme;
    var button = document.getElementById("theme-switch");
    if (!button) return;
    var label = theme === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro";
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  apply(saved());

  document.addEventListener("DOMContentLoaded", function () {
    apply(root.dataset.theme);
    document.getElementById("theme-switch").addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(KEY, next);
      } catch (error) {
        return apply(next);
      }
      apply(next);
    });
  });
})();
