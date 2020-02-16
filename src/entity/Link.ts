import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Link {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => User, user => user.links)
    user!: User;

    @Column({ length: "1023" })
    url!: string;

    @Column()
    isRead!: boolean;
    
    @Column()
    linkTitle!: string;
}