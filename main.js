/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/* Menu show */
navToggle.addEventListener('click', () =>{
   navMenu.classList.add('show-menu')
})

/* Menu hidden */
navClose.addEventListener('click', () =>{
   navMenu.classList.remove('show-menu')
})

$(".profile .icon_wrap").click(function () {
   console.log("test");
   $(this).parent().toggleClass("active");
   $(".notifications").removeClass("active");
});

$(".notifications .icon_wrap").click(function () {
   $(this).parent().toggleClass("active");
   $(".profile").removeClass("active");
});

$(".show_all .link").click(function () {
   $(".notifications").removeClass("active");
   $(".popup").show();
});

$(".close, .shadow").click(function () {
   $(".popup").hide();
});