import { useTranslation } from 'react-i18next';

export function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="text-center prose my-5">
			<h1>{t('Content not found')}</h1>
			<img
				className="mx-auto"
				// src="https://media1.tenor.com/images/26f9c333de269bffe3d24135fae3e19a/tenor.gif?itemid=5132600"
				src="https://random.dog/bfe9f3a4-d8ca-4f16-980c-56cacdeefdb9.gif"
				alt={t('Content not found')}
			/>
		</div>
	);
}
