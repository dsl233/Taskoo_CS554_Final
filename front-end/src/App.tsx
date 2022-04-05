import { createContext, useMemo, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, PaletteMode } from '@mui/material';
import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material/styles';
import Account from './components/account/Account';
import Error from './components/layout/Error';
import Home from './components/home/Home';
import { getMediaTheme } from './utils';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
	// set default theme mode
	const themeMode: PaletteMode = (window.sessionStorage.getItem('mode') as PaletteMode | null) ?? getMediaTheme();
	const [mode, setMode] = useState<PaletteMode>(themeMode);
	const colorMode = useMemo(
		() => ({
			// The dark mode switch would invoke this method
			toggleColorMode: () =>
				setMode((prevMode: PaletteMode) => {
					const targetMode = prevMode === 'light' ? 'dark' : 'light';
					window.sessionStorage.setItem('mode', targetMode);
					return targetMode;
				})
		}),
		[]
	);
	const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

	return (
		<ColorModeContext.Provider value={colorMode}>
			<ThemeProvider theme={theme}>
				<Router>
					<Box sx={{ height: '100vh', position: 'relative' }}>
						<Routes>
							<Route path='/' element={<Navigate to='/account/signin' replace />} />
							<Route path='/account/*' element={<Account />} />
							<Route path='/home/*' element={<Home />} />
							<Route path='/error/:code/:message' element={<Error />} />
							<Route path='*' element={<Error />} />
						</Routes>
					</Box>
				</Router>
			</ThemeProvider>
		</ColorModeContext.Provider>
	);
}

// set the paramters for theme
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
	palette: {
		mode,
		...(mode === 'light'
			? {
					// light mode
					primary: { main: '#3f6af6' },
					background: { default: '#eef2f5' }
			  }
			: {
					// dark mode
					background: { default: '#121212' }
			  })
	},
	typography: {
		fontFamily:
			"Avenir, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;"
	}
});

export default App;
