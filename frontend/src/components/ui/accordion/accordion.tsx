import { SlDetails } from "@shoelace-style/shoelace/dist/react"
import ChevronDownIcon from "@/components/ui/icons/chevron-down"
import './accordion.css'

type AccordionProps = {
    summary: React.ReactNode | string
    content: React.ReactNode | string
}

const Accordion: React.FC<AccordionProps> = ({ summary, content }) => {
    return (
        <SlDetails>
            <span slot="summary">{summary}</span>
            <ChevronDownIcon className="w-4 h-4 rotate-0" slot="expand-icon" />
            <ChevronDownIcon className="w-4 h-4 rotate-180" slot="collapse-icon" />
            {content}
        </SlDetails>

    )
}

export default Accordion