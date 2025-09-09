function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600">
            © {currentYear} Rubic Systems. Powered by O*NET Database.
          </div>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a
              href="https://www.onetonline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
              title="O*NET OnLine"
            >
              <img 
                src="https://services.onetcenter.org/shared/image/newui/onet_logo_print.png" 
                alt="O*NET Logo" 
                className="h-8"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-sm font-semibold hidden">O*NET OnLine</span>
            </a>
            
            <span className="text-gray-400">|</span>
            
            <a
              href="https://rubicsystems.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors font-semibold"
              title="Rubic Systems"
            >
              <span className="text-sm">Rubic Systems</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;