// About Us - static storefront page.
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="sf-static">
      <h1>About Garuda International</h1>
      <p className="sf-static__lead">
        Garuda International is a trusted retailer of home appliances, from small
        appliances like grinders, kettles and pressure cookers, to large appliances
        like refrigerators, televisions and washing machines, and more.
      </p>

      <div className="sf-static__grid">
        <div className="sf-static__card">
          <h3>Who we are</h3>
          <p>
            With multiple showrooms and a growing online store, we bring quality
            products from leading brands to customers across the region, backed by
            reliable service and support.
          </p>
        </div>
        <div className="sf-static__card">
          <h3>What we offer</h3>
          <p>
            A wide catalogue of appliances at fair prices, easy enquiries, home
            delivery, and a knowledgeable team ready to help you choose the right
            product for your home.
          </p>
        </div>
        <div className="sf-static__card">
          <h3>Our promise</h3>
          <p>
            Genuine products, transparent pricing, and a shopping experience that's
            simple whether you visit a showroom or shop online.
          </p>
        </div>
      </div>

      <div className="sf-static__cta">
        <Link to="/shop" className="sf-btn sf-btn--dark">Browse Products</Link>
        <Link to="/stores" className="sf-btn sf-btn--outline">Find a Showroom</Link>
      </div>
    </div>
  );
}

export default AboutPage;
