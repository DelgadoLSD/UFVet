// Ícones de cão e gato do Lucide (lucide.dev, licença ISC). O Material
// Symbols só tem uma pata genérica, que não diferencia as espécies.
const CAMINHOS = {
  cao: [
    "M11.25 16.25h1.5L12 17z",
    "M16 14v.5",
    "M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309",
    "M8 14v.5",
    "M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5",
  ],
  gato: [
    "M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z",
    "M8 14v.5",
    "M16 14v.5",
    "M11.25 16.25h1.5L12 17l-.75-.75Z",
  ],
};

function IconeEspecie({ especie, className = "w-[18px] h-[18px]" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {CAMINHOS[especie].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default IconeEspecie;
