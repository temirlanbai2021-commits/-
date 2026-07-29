import { Route, Switch } from 'wouter';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/game" component={GamePage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
