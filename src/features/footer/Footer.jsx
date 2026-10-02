import './footer.css'

export default function Footer() {
  return (
    <footer id="contact" className="footer-section" aria-label="Aerotech footer">
      <a
        className="footer-instagram"
        href="https://www.instagram.com/aerotech_aec/"
        target="_blank"
        rel="noreferrer"
        aria-label="Visit the Aerotech Instagram page"
      >
        <span className="footer-instagram-icon" aria-hidden="true">
          <img src='https://img.icons8.com/?size=100&id=Xy10Jcu1L2Su&format=png&color=000000'/>
        </span>
        <span>@aerotech</span>
      </a>

      <div className="footer-word-wrap footer-word-wrap--ghost">
        <h2 className="footer-word">AEROTECH</h2>
      </div>

      <div className="footer-word-wrap footer-word-wrap--main">
        <h2 className="footer-word">AEROTECH</h2>
      </div>
    </footer>
  )
}
