const Footer = () => {
 return (
   <footer className="flex items-center justify-center border-t py-4">
     <span className="text-sm text-muted-foreground text-center w-full">Rick&apos;s live stream mvp demo &copy; {new Date().getFullYear()}</span>
   </footer>
 );
};

export default Footer;