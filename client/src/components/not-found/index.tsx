import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <h1 className="text-9xl font-extrabold tracking-widest text-gray-400">404</h1>
      <div className="bg-red-500 px-2 text-sm rounded rotate-12 absolute">Page Not Found</div>
      <p className="mt-4 text-lg text-gray-300">Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="mt-6 px-6 py-3 bg-destructive text-white font-bold rounded-lg hover:bg-red-700 transition-all duration-300 shadow-lg">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
