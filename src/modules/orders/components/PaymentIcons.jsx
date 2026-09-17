// Accepted payment app logos shown on the invoice footer — real brand SVGs
// bundled from src/assets so they always render and print cleanly.
import phonepe from "../../../assets/phonepe.svg";
import gpay from "../../../assets/google-pay.svg";
import paytm from "../../../assets/paytm.svg";
import upi from "../../../assets/upi.svg";

export default function PaymentIcons({ size = 22 }) {
  const imgStyle = { height: size, width: "auto", objectFit: "contain", display: "block" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <img src={phonepe} alt="PhonePe" style={imgStyle} />
      <img src={gpay} alt="Google Pay" style={imgStyle} />
      <img src={paytm} alt="Paytm" style={imgStyle} />
      <img src={upi} alt="UPI" style={imgStyle} />
    </div>
  );
}
