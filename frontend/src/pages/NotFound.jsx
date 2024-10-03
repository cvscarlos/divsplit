import { useTranslation } from 'react-i18next';

export function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="text-center prose my-5">
			<h1>{t('Content not found')}</h1>
			<img
				className="mx-auto"
				src="https://media1.tenor.com/images/26f9c333de269bffe3d24135fae3e19a/tenor.gif?itemid=5132600"
				alt={t('Content not found')}
			/>
		</div>
	);
}
