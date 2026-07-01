import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// The legal copy is short and self-contained, so it lives here in both languages rather than
// as dozens of i18n keys — easier to read and keep the two versions in sync.
function Layout({ title, children }: { title: string; children: ReactNode }) {
	return (
		<article className="mx-auto max-w-2xl">
			<h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
			<div className="text-muted-foreground [&_strong]:text-foreground space-y-4 leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
				{children}
			</div>
		</article>
	);
}

const isPt = (lng: string) => lng.startsWith('pt');

export function PrivacyPage() {
	const { i18n } = useTranslation();
	return isPt(i18n.language) ? (
		<Layout title="Política de Privacidade">
			<p>O DivSplit é feito para saber o mínimo possível sobre você.</p>
			<ul>
				<li>
					<strong>Sem contas, sem dados pessoais.</strong> Nunca pedimos seu nome, e-mail ou qualquer informação que te
					identifique. Não existe login.
				</li>
				<li>
					<strong>Seus dados são seus.</strong> Tudo o que você digita é salvo primeiro no seu próprio navegador, e o
					app funciona totalmente offline.
				</li>
				<li>
					<strong>Sincronização opcional.</strong> Quando você está online, os dados de um evento sincronizam com nosso
					banco de dados para que outras pessoas com o link possam vê-los. Ele é identificado apenas por um id aleatório
					— nada o liga a você pessoalmente.
				</li>
				<li>
					<strong>Compartilhamento baseado em confiança.</strong> Qualquer pessoa com o link de um evento pode vê-lo e
					editá-lo. Compartilhe apenas com pessoas de confiança.
				</li>
				<li>
					<strong>Sem rastreamento.</strong> Não usamos analytics, publicidade ou rastreadores de terceiros, e não
					vendemos nem compartilhamos seus dados.
				</li>
			</ul>
			<p>Como não coletamos dados pessoais, não há nada para perdermos, vazarmos ou entregarmos.</p>
		</Layout>
	) : (
		<Layout title="Privacy Policy">
			<p>DivSplit is built to know as little about you as possible.</p>
			<ul>
				<li>
					<strong>No accounts, no personal data.</strong> We never ask for your name, email, or any identifying
					information. There is no login.
				</li>
				<li>
					<strong>Your data is yours.</strong> Everything you enter is stored first in your own browser, and the app
					works fully offline.
				</li>
				<li>
					<strong>Optional sync.</strong> When you are online, an event’s data syncs to our database so others with the
					link can see it. It is identified only by a random event id — nothing links it to you personally.
				</li>
				<li>
					<strong>Trust-based sharing.</strong> Anyone who has an event’s link can view and edit it. Share links only
					with people you trust.
				</li>
				<li>
					<strong>No tracking.</strong> We don’t use analytics, advertising, or third-party trackers, and we don’t sell
					or share your data.
				</li>
			</ul>
			<p>Because we don’t collect personal data, there is nothing for us to lose, leak, or hand over.</p>
		</Layout>
	);
}

export function TermsPage() {
	const { i18n } = useTranslation();
	return isPt(i18n.language) ? (
		<Layout title="Termos de Uso">
			<p>O DivSplit é gratuito, aberto e fornecido “como está”.</p>
			<ul>
				<li>
					<strong>Sem garantias.</strong> O aplicativo é fornecido “como está”, sem garantia de qualquer tipo, expressa
					ou implícita, incluindo, entre outras, comercialização, adequação a um propósito específico e não violação.
				</li>
				<li>
					<strong>Use por sua conta e risco.</strong> Você é responsável por conferir suas despesas, divisões e saldos.
					O DivSplit faz os cálculos para ajudar, mas pode conter erros.
				</li>
				<li>
					<strong>Sem responsabilidade.</strong> Em nenhuma hipótese os autores serão responsáveis por qualquer
					reclamação, dano ou outra responsabilidade — incluindo perda de dados ou acertos incorretos — decorrente do
					uso do aplicativo.
				</li>
				<li>
					<strong>Seus dados.</strong> Como qualquer pessoa com o link de um evento pode editá-lo, mantenha seus links
					privados. Você pode exportar seus dados a qualquer momento.
				</li>
			</ul>
		</Layout>
	) : (
		<Layout title="Terms of Service">
			<p>DivSplit is free, open, and provided “as is”.</p>
			<ul>
				<li>
					<strong>No warranty.</strong> The app is provided “as is”, without warranty of any kind, express or implied,
					including but not limited to merchantability, fitness for a particular purpose, and non-infringement.
				</li>
				<li>
					<strong>Use at your own risk.</strong> You are responsible for verifying your own expenses, splits, and
					balances. DivSplit does the math to help you, but may contain errors.
				</li>
				<li>
					<strong>No liability.</strong> In no event shall the authors be liable for any claim, damages, or other
					liability — including lost data or incorrect settlements — arising from the use of the app.
				</li>
				<li>
					<strong>Your data.</strong> Because anyone with an event link can edit it, keep your links private. You can
					export your data at any time.
				</li>
			</ul>
		</Layout>
	);
}
