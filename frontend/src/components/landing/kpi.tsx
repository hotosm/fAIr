import './styles.css'

type TKPIS = {
  figure: string
  label: string
}[]

const KPIs: TKPIS = [
  {
    figure: '162,1M',
    label: 'Building Mapped'
  },
  {
    figure: '590',
    label: 'Published Models'
  },
  {
    figure: '100.3K',
    label: 'Mappers'
  },
  {
    figure: '86',
    label: 'Mappers'
  }
]

const KPI = () => {
  return (
    <section className='kpi'>
      {KPIs.map((kpi, id) => (
        <div key={`kpi-${id}`} className='kpi-item'>
          <h1>{kpi.figure}</h1>
          <h3>{kpi.label}</h3>
        </div>
      ))}
    </section>
  )
}

export default KPI
