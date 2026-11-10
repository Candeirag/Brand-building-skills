/**
 * Mostrado quando o navegador não tem WebGL ou a cena 3D falha: uma imagem
 * estática da própria cena. A telemetria e o gráfico continuam respondendo à
 * rolagem por cima dela.
 */
export function HeroFallback() {
  return (
    <div className="absolute inset-0 bg-void">
      <img
        src="images/hero-poster.jpg"
        alt="Carro esportivo preto preso a um dinamômetro de rolos, numa oficina escura com luzes de LED."
        className="h-full w-full object-cover object-[62%_50%]"
      />
    </div>
  );
}
