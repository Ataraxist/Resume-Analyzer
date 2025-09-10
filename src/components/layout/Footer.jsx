function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear}{' '}
            <a 
              href="https://rubicsystems.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Rubic Systems
            </a>
            . Powered by{' '}
            <a 
              href="https://www.onetonline.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              O*NET Database
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;