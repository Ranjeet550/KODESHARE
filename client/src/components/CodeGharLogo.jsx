const CodeGharLogo = ({ className = "h-8 w-8 mr-2" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className}
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* House shape */}
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {/* Code brackets */}
      <polyline points="9 14 7 16 9 18" />
      <polyline points="15 14 17 16 15 18" />
      {/* Slash in the middle */}
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="14" y1="13" x2="10" y2="19" />
    </svg>
  );
};

export default CodeGharLogo;
