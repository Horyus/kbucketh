import { bitDistance, deserialize, distance, serialize } from './Utility';
import * as _ from 'lodash';

/**
 * Interface used to store in which bucket every ID is stored.
 * Shared between all buckets.
 */
interface ISharedPeerRegistry {
    peers: Uint8Array[];
}
/**
 * Configuration interface for the {@link KBucketh} creator.
 */
export interface ICreateConfig {
    bit_distance?: number;
    bucket_size?: number;
}

/**
 * Create the first KBucketh of the list. Use this function instead of the
 * constructor.
 *
 * @param {any} peer_id ID of the local Peer.
 * @param {ICreateConfig} config Configuration for the KBucketh.
 */
export function create(peer_id: any, config?: ICreateConfig): KBucketh {
    const shared_peer_registry = {peers: []} as ISharedPeerRegistry;
    return (new KBucketh(
            peer_id,
            config ? (config.bit_distance || 159) : 159,
            shared_peer_registry,
            config ? (config.bucket_size || 20) : 20)
    );
}

/**
 * Interface representing a Peer
 */
export interface IPeer {
    peerID: Uint8Array;
    distance: number;
    bit_distance: number;
    data: any;
    last_action: number;
}

/**
 * Data interface returned from get Method
 */
export interface IPeerData {
    bucketID: number;
    waitlist: boolean;
    data: any;
}

/**
 * Type used to store Peers
 */
type IPeerRegistry = IPeer[];

/**
 * Action types
 */
const KBKActionTypes = {
    Add: 'ADD',
    Remove: 'REMOVE',
    Get: 'GET',
    Set: 'SET',
    Update: 'UPDATE',
    FindAndRun: 'FIND_AND_RUN'
};

/**
 * Return values of the {@link KBucketh.add} method
 */
export const KBKAddReturn = {
    AlreadyExists: -1,
    AddedToBucket: 0,
    AddedToWaitlist: 1
};

/**
 * Return values of the {@link KBucketh.remove} method
 */
export const KBKRemoveReturn = {
    NotFound: -1,
    RemovedFromBucket: 0,
    RemovedFromWaitlist: 1
};

/**
 * Return values of the {@link KBucketh.set} method
 */
export const KBKSetReturn = {
    NotFound: -1,
    EditedFromBucket: 0,
    EditedFromWaitlist: 1
};

/**
 * Return values of the {@link KBucketh.update} method
 */
export const KBKUpdateReturn = {
    NotFound: -1,
    UpdatedFromBucket: 0,
    UpdatedFromWaitlist: 1
};

/**
 * Action Interface.
 */
interface IKBKAction<ActionType> {
    type: string;
    payload: ActionType;
    peerID: Uint8Array;
    distance: number;
    bit_distance: number;
}

/**
 * Action Interface for the Find and Run logic.
 */
interface IKBKFindAndRun<SubActionType> {
    action: IKBKAction<SubActionType>;
}

/**
 * Action Interface for the Add logic.
 */
interface IKBKAdd<AdditionalData = void> {
    data: AdditionalData;
}

/**
 * Action interface for the Remove logic.
 */
interface IKBKRemove {

}

/**
 * Action interface for the Get logic.
 */
interface IKBKGet {

}

/**
 * Action interface for the Set logic.
 */
interface IKBKSet {
    data: any;
}

/**
 * Action interface for the Update logic.
 */
interface IKBKUpdate {
}

/**
 * Interface for the Action functions store.
 */
interface IActionStore {
    [key: string]: (action: IKBKAction<any>) => any;
}

/**
 * Main class. Self expanding double linked list. All nodes are aware of PeerID positions.
 */
export class KBucketh {

    private readonly _peer_id: Uint8Array;
    private readonly _deserialized_peer_id: string;
    private readonly _bit_distance: number;
    private readonly _peer_id_registry: ISharedPeerRegistry;
    private readonly _bucket_size: number;
    private _bucket: IPeerRegistry = [];
    private _waitlist_bucket: IPeerRegistry = [];

    private _left_bucket: KBucketh = null;
    private _right_bucket: KBucketh = null;

    private readonly _actions: IActionStore = {};

    /**
     * @param {any} peer_id ID of the local Peer.
     * @param {number} bit_distance Bit distance of the current KBucketh.
     * @param {ISharedPeerRegistry} peer_id_registry Shared Peer Registry
     * @param {number} bucket_size Size of the bucket.
     */
    public constructor(peer_id: any, bit_distance: number, peer_id_registry: ISharedPeerRegistry, bucket_size: number) {
        this._peer_id = serialize(peer_id);
        this._deserialized_peer_id = deserialize(this._peer_id);
        this._bit_distance = bit_distance;
        this._peer_id_registry = peer_id_registry;
        this._bucket_size = bucket_size;

        this._actions[KBKActionTypes.Add] = (action: IKBKAction<IKBKAdd>): number => {
            if (this._bucket.length === this._bucket_size) {
                this._waitlist_bucket.push({
                    peerID: action.peerID,
                    distance: action.distance,
                    bit_distance: action.bit_distance,
                    data: action.payload.data,
                    last_action: Date.now()
                });
                return 1;
            } else {
                if (this._bucket.filter((elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) return -1;
                this._bucket.unshift({
                    peerID: action.peerID,
                    distance: action.distance,
                    bit_distance: action.bit_distance,
                    data: action.payload.data,
                    last_action: Date.now()
                });
                this._peer_id_registry.peers.push(action.peerID);
                return 0;
            }
        };

        this._actions[KBKActionTypes.Remove] = (action: IKBKAction<IKBKRemove>): number => {
            if (this._bucket.length === 0) {

                return -1;

            } else if (this._bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._bucket = this._bucket.filter((elem: IPeer) => (!_.isEqual(elem.peerID, action.peerID)));
                this._peer_id_registry.peers = this._peer_id_registry.peers.filter((e: Uint8Array) => !_.isEqual(e, action.peerID));
                return 0;

            } else if (this._waitlist_bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._waitlist_bucket = this._waitlist_bucket.filter((elem: IPeer) => (!_.isEqual(elem.peerID, action.peerID)));
                return 1;

            } else return -1;
        };

        this._actions[KBKActionTypes.Get] = (action: IKBKAction<IKBKGet>): IPeerData => {
            if (this._bucket.length === 0) {

                return null;

            } else if (this._bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                return {
                    bucketID: this._bit_distance,
                    waitlist: false,
                    data: this._bucket.filter((elem: IPeer) => (_.isEqual(elem.peerID, action.peerID)))[0].data
                };

            } else if (this._waitlist_bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                return {
                    bucketID: this._bit_distance,
                    waitlist: true,
                    data: this._waitlist_bucket.filter((elem: IPeer) => (_.isEqual(elem.peerID, action.peerID)))[0].data
                };

            } else return null;
        };

        this._actions[KBKActionTypes.Set] = (action: IKBKAction<IKBKSet>): number => {
            if (this._bucket.length === 0) {

                return -1;

            } else if (this._bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._bucket = this._bucket.map((elem: IPeer) => {
                    if (_.isEqual(elem.peerID, action.peerID)) {
                        return {
                            ...elem,
                            data: action.payload.data
                        };
                    } else return elem;
                });

                return 0;

            } else if (this._waitlist_bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._waitlist_bucket = this._waitlist_bucket.map((elem: IPeer) => {
                    if (_.isEqual(elem.peerID, action.peerID)) {
                        return {
                            ...elem,
                            data: action.payload.data
                        };
                    } else return elem;
                });

                return 1;

            } else return -1;
        };

        this._actions[KBKActionTypes.Update] = (action: IKBKAction<IKBKUpdate>): number => {
            if (this._bucket.length === 0) {

                return -1;

            } else if (this._bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._bucket = this._bucket
                    .map((elem: IPeer) => {
                        if (_.isEqual(elem.peerID, action.peerID)) {
                            return {
                                ...elem,
                                last_action: Date.now()
                            };
                        } else return elem;
                    })
                    .sort((a: IPeer, b: IPeer) => b.last_action - a.last_action);

                return 0;

            } else if (this._waitlist_bucket.filter(
                (elem: IPeer) => (_.isEqual(elem.peerID, action.peerID))).length) {

                this._waitlist_bucket = this._waitlist_bucket
                    .map((elem: IPeer) => {
                        if (_.isEqual(elem.peerID, action.peerID)) {
                            return {
                                ...elem,
                                last_action: Date.now()
                            };
                        } else return elem;
                    })
                    .sort((a: IPeer, b: IPeer) => b.last_action - a.last_action);

                return 1;

            } else return -1;

        };

    }

    /**
     * Return the ID of the Peer in its serialized form.
     */
    public get PeerID(): Uint8Array {
        return this._peer_id;
    }

    /**
     * Return the ID of the Peer in its deserialized form.
     */
    public get DeserializedPeerID(): string {
        return this._deserialized_peer_id;
    }

    /**
     * Return the ID of the KBucketh.
     */
    public get BucketID(): number {
        return this._bit_distance;
    }

    /**
     * Return the total size of the bucket.
     */
    public get limit(): number {
        return this._bucket_size;
    }

    /**
     * Return the current stored Peer count in this KBucketh.
     */
    public get size(): number {
        return this._bucket.length;
    }

    /**
     * Return ordered list of peers in the bucket.
     */
    public get list(): string[] {
        return this._bucket
            .map((e: IPeer) => deserialize(e.peerID));
    }

    /**
     * Return ordered list of peers in the bucket wailist.
     */
    public get waitlist(): string[] {
        return this._waitlist_bucket
            .map((e: IPeer) => deserialize(e.peerID));
    }

    /**
     * Return the current stored Peer count in this KBucketh's waitlist.
     */
    public get waitlist_size(): number {
        return this._waitlist_bucket.length;
    }

    /**
     * Return left KBucketh
     */
    public get left(): KBucketh {
        return this._left_bucket;
    }

    /**
     * Return right KBucketh
     */
    public get right(): KBucketh {
        return this._right_bucket;
    }

    /**
     * Return true if current KBucketh is removable
     */
    public get removable(): boolean {
        return (!this._waitlist_bucket.length && !this._bucket.length && this._bit_distance !== 0 && !this._left_bucket);
    }

    /**
     * Add the given Peer ID to the distributed KBucketh list. It will automatically find
     * the appropriate KBucketh, and will expand the list if needed.
     *
     * @param {any} peer_id Peer ID to add.
     * @param payload Additional data to add with the peer informations.
     */
    public add<AdditionalData = void>(peer_id: any, payload: AdditionalData): number {
        const serialized: Uint8Array = serialize(peer_id);
        const action_payload: IKBKAction<IKBKAdd<AdditionalData>> = {
            type: KBKActionTypes.Add,
            payload: {
                data: payload
            },
            peerID: serialized,
            distance: distance(this._peer_id, serialized),
            bit_distance: bitDistance(this._peer_id, serialized)
        };
        return this.exec<IKBKAdd<AdditionalData>>(action_payload);
    }

    /**
     * Add the given Peer ID to the distributed KBucketh list. It will automatically find
     * the appropriate KBucketh, and will expand the list if needed.
     *
     * @param {any} peer_id Peer ID to add.
     * @param payload Additional data to add with the peer informations.
     */
    public remove(peer_id: any): number {
        const serialized: Uint8Array = serialize(peer_id);
        const action_payload: IKBKAction<IKBKRemove> = {
            type: KBKActionTypes.Remove,
            payload: null,
            peerID: serialized,
            distance: distance(this._peer_id, serialized),
            bit_distance: bitDistance(this._peer_id, serialized)
        };
        return this.exec<IKBKRemove>(action_payload);
    }

    /**
     * Get informations about the given Peer ID. Returns null if the peer is not found
     *
     * @param {any} peer_id The Peer ID from which we want informations
     */
    public get(peer_id: any): IPeerData {
        const serialized: Uint8Array = serialize(peer_id);
        const action_payload: IKBKAction<IKBKGet> = {
            type: KBKActionTypes.Get,
            payload: null,
            peerID: serialized,
            distance: distance(this._peer_id, serialized),
            bit_distance: bitDistance(this._peer_id, serialized)
        };
        return this.exec<IKBKGet>(action_payload);
    }

    /**
     * Set informations about the given Peer ID.
     *
     * @param {any} peer_id The Peer ID from which we want to edit
     * @param data The new data to bind to the Peer
     */
    public set<AdditionalData = any>(peer_id: any, data: AdditionalData): IPeerData {
        const serialized: Uint8Array = serialize(peer_id);
        const action_payload: IKBKAction<IKBKSet> = {
            type: KBKActionTypes.Set,
            payload: {
                data
            },
            peerID: serialized,
            distance: distance(this._peer_id, serialized),
            bit_distance: bitDistance(this._peer_id, serialized)
        };
        return this.exec<IKBKSet>(action_payload);
    }

    /**
     * Update last action timestamp of the peer.
     *
     * @param {any} peer_id The Peer ID from which we want to update last action timestamp
     */
    public update(peer_id: any): number {
        const serialized: Uint8Array = serialize(peer_id);
        const action_payload: IKBKAction<IKBKUpdate> = {
            type: KBKActionTypes.Update,
            payload: null,
            peerID: serialized,
            distance: distance(this._peer_id, serialized),
            bit_distance: bitDistance(this._peer_id, serialized)
        };
        return this.exec<IKBKUpdate>(action_payload);
    }

    /**
     * Get the nearest peer by xor distance from the required Peer ID.
     *
     * @param {any} peer_id Peer ID from which we seek the neighbours.
     * @param {number} amount Amount of Neighours requested.
     */
    public getNearest(peer_id: any, amount: number): string[] {
        const serialized = serialize(peer_id);
        return this._peer_id_registry.peers
            .map((e: Uint8Array) =>
                ({
                    id: e,
                    distance: distance(serialized, e)
                }))
            .sort((left: any, right: any) => left.distance - right.distance)
            .slice(0, amount)
            .map((e: any) =>
                deserialize(e.id));
    }

    private run_right<ActionType>(action: IKBKAction<ActionType>): number {
        if (!this._right_bucket) {
            this._right_bucket = new KBucketh(this._peer_id, this._bit_distance + 1, this._peer_id_registry, this._bucket_size);
            this._right_bucket._left_bucket = this;
        }
        return this._right_bucket.exec(action);
    }

    private run_left<ActionType>(action: IKBKAction<ActionType>): number {
        if (!this._left_bucket) {
            this._left_bucket = new KBucketh(this._peer_id, this._bit_distance - 1, this._peer_id_registry, this._bucket_size);
            this._left_bucket._right_bucket = this;
        }
        return this._left_bucket.exec(action);
    }

    private exec<ActionType>(action: IKBKAction<ActionType>): any {
        if (action.type !== KBKActionTypes.FindAndRun) {
            if (action.bit_distance !== this._bit_distance) {
                const payload: IKBKAction<IKBKFindAndRun<ActionType>> = {
                    type: KBKActionTypes.FindAndRun,
                    payload: {
                        action: action
                    },
                    peerID: action.peerID,
                    distance: action.distance,
                    bit_distance: action.bit_distance
                };
                return this.exec(payload);
            } else {
                return this._actions[action.type](action);
            }
        } else {
            if (action.bit_distance !== this._bit_distance) {
                const res = action.bit_distance < this._bit_distance ? this.run_left(action) : this.run_right(action);
                if (this._left_bucket && this._left_bucket.removable) this._left_bucket = null;
                return res;
            } else {
                return this.exec<any>((<any> action.payload).action);
            }
        }
    }

}
