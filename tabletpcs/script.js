var slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("noahGalleryMySlides");
    var dots = document.getElementsByClassName("noahGalleryDemo");
    var captionText = document.getElementById("noahGalleryCaptionText");

    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" noahGalleryActive", "");
    }

    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " noahGalleryActive";
    captionText.innerHTML = dots[slideIndex-1].alt

}
