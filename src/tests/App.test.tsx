import { render } from '@testing-library/react';
import App from 'components/app/App';

test('Renders Home/Login page.', async () => {
  const { findByText } = render(<App />);

  const homeText = await findByText(/TemplateUI/i);

  expect(homeText).toBeInTheDocument();
});
