const actionButtons = document.querySelectorAll("button");

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("scale-[0.98]");
    setTimeout(() => button.classList.remove("scale-[0.98]"), 120);
  });
});
