import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { TaskBoardPage } from './pages/TaskBoard.page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/examples/taskboard',
    element: <TaskBoardPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
