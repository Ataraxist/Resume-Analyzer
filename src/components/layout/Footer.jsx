function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div className="text-sm text-gray-600">
            © {currentYear} Rubic Systems. Powered by O*NET Database.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;